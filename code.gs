/**
 * Money Manager - Google Apps Script backend
 *
 * Setup (Script Properties):
 * - SPREADSHEET_ID: Optional. If empty, uses the bound spreadsheet.
 * - APPROVED_USERS: Optional comma-separated allowlist emails.
 * - ALLOW_ALL_IF_NO_APPROVALS: "true" or "false" (default "false").
 * - GOOGLE_CLIENT_IDS: Optional comma-separated OAuth client IDs for token audience validation.
 * - VERIFY_GOOGLE_TOKEN_ON_VERIFY_USER: "true" or "false" (default "true").
 * - VERIFY_GOOGLE_TOKEN_ON_MUTATION: "true" or "false" (default "true").
 * - REQUIRE_TOKEN_FOR_MUTATIONS: "true" or "false" (default "true").
 */

var MM = {
  SHEETS: {
    TRANSACTIONS: 'Transactions',
    CATEGORIES: 'Categories',
    USERS: 'Users',
  },
  HEADERS: {
    TRANSACTIONS: [
      'transactionId',
      'timestamp',
      'date',
      'type',
      'category',
      'subCategory',
      'amount',
      'shortDescription',
      'tag',
      'createdByEmail',
      'createdByName',
      'updatedAt',
    ],
    CATEGORIES: [
      'type',
      'name',
      'icon',
      'subCategories',
      'createdByEmail',
      'createdAt',
      'updatedAt',
    ],
    USERS: [
      'email',
      'name',
      'picture',
      'approved',
      'role',
      'lastLoginAt',
      'updatedAt',
    ],
  },
  TOKEN_INFO_URL: 'https://oauth2.googleapis.com/tokeninfo?id_token=',
  LOCK_TIMEOUT_MS: 20000,
};

function doGet(e) {
  return handleRequest_('GET', e);
}

function doPost(e) {
  return handleRequest_('POST', e);
}

function handleRequest_(method, e) {
  try {
    ensureSchema_();
    var req = parseRequest_(method, e);
    if (!req.action) throw new Error('Missing action.');
    var data = dispatchAction_(req);
    return jsonResponse_({ ok: true, data: data });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : 'Unexpected server error.',
    });
  }
}

function parseRequest_(method, e) {
  var parameter = (e && e.parameter) || {};
  var action = '';
  var payload = {};
  var token = '';

  if (method === 'GET') {
    action = safeString_(parameter.action);
    payload = {};
    return {
      method: method,
      action: action,
      payload: payload,
      token: token,
      params: parameter,
    };
  }

  var body = {};
  var raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch (err) {
      throw new Error('Invalid JSON payload.');
    }
  }

  action = safeString_(body.action || parameter.action);
  payload = isObject_(body.payload) ? body.payload : {};
  token = safeString_(body.token);

  return {
    method: method,
    action: action,
    payload: payload,
    token: token,
    params: parameter,
  };
}

function dispatchAction_(req) {
  var action = req.action;
  switch (action) {
    case 'verifyUser':
      return handleVerifyUser_(req.payload, req.token);
    case 'getBootstrapData':
      return handleGetBootstrapData_(req.params, req.payload);
    case 'getTransactions':
      return handleGetTransactions_(req.params, req.payload);
    case 'addTransaction':
      return handleAddTransaction_(req.payload, req.token);
    case 'updateTransaction':
      return handleUpdateTransaction_(req.payload, req.token);
    case 'deleteTransaction':
      return handleDeleteTransaction_(req.payload, req.token);
    case 'getCategories':
      return handleGetCategories_();
    case 'addCategory':
      return handleAddCategory_(req.payload, req.token);
    case 'exportTransactions':
      return handleExportTransactions_(req.payload);
    default:
      throw new Error('Unsupported action: ' + action);
  }
}

function handleVerifyUser_(payload, token) {
  var email = normalizeEmail_(payload.email);
  if (!email) throw new Error('Email is required.');

  var cfg = getRuntimeConfig_();
  var tokenProfile = null;
  if (cfg.verifyGoogleTokenOnVerifyUser) {
    if (!token) throw new Error('Google token is required.');
    tokenProfile = verifyGoogleIdToken_(token, email, cfg.googleClientIds);
    email = normalizeEmail_(tokenProfile.email || email);
  }

  if (!isEmailApproved_(email, cfg)) {
    throw new Error('Access denied. Your account is not approved.');
  }

  var name = safeString_(payload.name || (tokenProfile && tokenProfile.name));
  var picture = safeString_(payload.picture || (tokenProfile && tokenProfile.picture));
  upsertUser_(email, name, picture, true);

  return {
    approved: true,
    email: email,
    name: name,
    picture: picture,
  };
}

function handleGetBootstrapData_(params, payload) {
  var email = normalizeEmail_(params.email || payload.email);
  if (!email) throw new Error('Email is required.');
  enforceApprovedEmail_(email, getRuntimeConfig_());

  return {
    transactions: getTransactionsByEmail_(email),
    categories: getCategoriesAll_(),
    meta: { mock: false },
  };
}

function handleGetTransactions_(params, payload) {
  var email = normalizeEmail_(params.email || payload.email);
  if (!email) throw new Error('Email is required.');
  enforceApprovedEmail_(email, getRuntimeConfig_());
  return getTransactionsByEmail_(email);
}

function handleAddTransaction_(payload, token) {
  var cfg = getRuntimeConfig_();
  var actorEmail = resolveActorEmail_(payload, token, cfg);
  var actorName = safeString_(payload.createdByName);
  var tx = sanitizeTransactionPayload_(payload, actorEmail, actorName, true);
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(MM.LOCK_TIMEOUT_MS);
    var sheet = ensureSheetWithHeaders_(MM.SHEETS.TRANSACTIONS, MM.HEADERS.TRANSACTIONS);
    var row = objectToRow_(tx, MM.HEADERS.TRANSACTIONS);
    sheet.appendRow(row);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }

  return tx;
}

function handleUpdateTransaction_(payload, token) {
  var txId = safeString_(payload.transactionId);
  if (!txId) throw new Error('transactionId is required.');

  var cfg = getRuntimeConfig_();
  var actorEmail = resolveActorEmail_(payload, token, cfg);
  var lock = LockService.getScriptLock();
  var updated = null;

  try {
    lock.waitLock(MM.LOCK_TIMEOUT_MS);
    var sheet = ensureSheetWithHeaders_(MM.SHEETS.TRANSACTIONS, MM.HEADERS.TRANSACTIONS);
    var rows = getDataRows_(sheet, MM.HEADERS.TRANSACTIONS.length);
    var changedRows = [];
    var found = false;

    for (var i = 0; i < rows.length; i++) {
      var current = rowToObject_(rows[i], MM.HEADERS.TRANSACTIONS);
      if (safeString_(current.transactionId) !== txId) {
        changedRows.push(rows[i]);
        continue;
      }

      found = true;
      if (normalizeEmail_(current.createdByEmail) !== actorEmail) {
        throw new Error('You can only update your own transactions.');
      }

      var merged = {};
      for (var h = 0; h < MM.HEADERS.TRANSACTIONS.length; h++) {
        var key = MM.HEADERS.TRANSACTIONS[h];
        merged[key] = current[key];
      }
      for (var field in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          merged[field] = payload[field];
        }
      }

      merged.createdByEmail = actorEmail;
      merged.updatedAt = nowIso_();
      updated = sanitizeTransactionPayload_(
        merged,
        actorEmail,
        safeString_(merged.createdByName),
        false,
      );
      changedRows.push(objectToRow_(updated, MM.HEADERS.TRANSACTIONS));
    }

    if (!found) throw new Error('Transaction not found.');
    replaceSheetData_(sheet, MM.HEADERS.TRANSACTIONS.length, changedRows);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }

  return updated;
}

function handleDeleteTransaction_(payload, token) {
  var txId = safeString_(payload.transactionId);
  if (!txId) throw new Error('transactionId is required.');

  var cfg = getRuntimeConfig_();
  var actorEmail = resolveActorEmail_(payload, token, cfg);
  var lock = LockService.getScriptLock();
  var found = false;

  try {
    lock.waitLock(MM.LOCK_TIMEOUT_MS);
    var sheet = ensureSheetWithHeaders_(MM.SHEETS.TRANSACTIONS, MM.HEADERS.TRANSACTIONS);
    var rows = getDataRows_(sheet, MM.HEADERS.TRANSACTIONS.length);
    var kept = [];

    for (var i = 0; i < rows.length; i++) {
      var current = rowToObject_(rows[i], MM.HEADERS.TRANSACTIONS);
      if (safeString_(current.transactionId) !== txId) {
        kept.push(rows[i]);
        continue;
      }

      found = true;
      if (normalizeEmail_(current.createdByEmail) !== actorEmail) {
        throw new Error('You can only delete your own transactions.');
      }
    }

    if (!found) throw new Error('Transaction not found.');
    replaceSheetData_(sheet, MM.HEADERS.TRANSACTIONS.length, kept);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }

  return {
    deleted: true,
    transactionId: txId,
  };
}

function handleGetCategories_() {
  return getCategoriesAll_();
}

function handleAddCategory_(payload, token) {
  var cfg = getRuntimeConfig_();
  var actorEmail = resolveActorEmail_(payload, token, cfg);
  var lock = LockService.getScriptLock();
  var saved = null;

  try {
    lock.waitLock(MM.LOCK_TIMEOUT_MS);
    var sheet = ensureSheetWithHeaders_(MM.SHEETS.CATEGORIES, MM.HEADERS.CATEGORIES);
    var rows = getDataRows_(sheet, MM.HEADERS.CATEGORIES.length);
    var incoming = sanitizeCategoryPayload_(payload, actorEmail, true);
    var changedRows = [];
    var matched = false;

    for (var i = 0; i < rows.length; i++) {
      var current = rowToObject_(rows[i], MM.HEADERS.CATEGORIES);
      if (
        normalizeType_(current.type) === incoming.type &&
        safeString_(current.name).toLowerCase() === incoming.name.toLowerCase()
      ) {
        matched = true;
        var mergedSubs = uniqueStrings_(
          parseSubCategories_(current.subCategories).concat(incoming.subCategories),
        );
        current.icon = incoming.icon || current.icon || 'circle-dollar-sign';
        current.subCategories = mergedSubs;
        current.updatedAt = nowIso_();
        saved = sanitizeCategoryPayload_(current, actorEmail, false);
        changedRows.push(objectToRow_(saved, MM.HEADERS.CATEGORIES));
      } else {
        changedRows.push(rows[i]);
      }
    }

    if (!matched) {
      saved = incoming;
      changedRows.push(objectToRow_(saved, MM.HEADERS.CATEGORIES));
    }

    replaceSheetData_(sheet, MM.HEADERS.CATEGORIES.length, changedRows);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }

  return categoryForClient_(saved);
}

function handleExportTransactions_(payload) {
  var email = normalizeEmail_(payload.email);
  if (!email) throw new Error('Email is required.');
  enforceApprovedEmail_(email, getRuntimeConfig_());

  var rows = getTransactionsByEmail_(email);
  return {
    csv: transactionsToCsv_(rows),
    count: rows.length,
  };
}

function sanitizeTransactionPayload_(payload, actorEmail, actorName, isCreate) {
  var now = nowIso_();
  var txId = safeString_(payload.transactionId);
  if (!txId) txId = Utilities.getUuid();

  var amount = Number(payload.amount);
  if (!isFinite(amount)) throw new Error('Amount must be a valid number.');

  var type = normalizeType_(payload.type);
  var date = toIsoDate_(payload.date || payload.timestamp || now);
  var tag = safeString_(payload.tag);
  if (!tag) tag = type === 'Money In' ? 'Receivable' : 'Payable';

  var tx = {
    transactionId: txId,
    timestamp: safeString_(payload.timestamp || now),
    date: date,
    type: type,
    category: safeString_(payload.category),
    subCategory: safeString_(payload.subCategory),
    amount: amount,
    shortDescription: safeString_(payload.shortDescription),
    tag: tag,
    createdByEmail: actorEmail,
    createdByName: safeString_(payload.createdByName || actorName),
    updatedAt: safeString_(payload.updatedAt || now),
  };

  if (!tx.category) throw new Error('Category is required.');
  if (!tx.date) throw new Error('Date is required.');
  if (isCreate && !tx.timestamp) tx.timestamp = now;
  return tx;
}

function sanitizeCategoryPayload_(payload, actorEmail, isCreate) {
  var now = nowIso_();
  var category = {
    type: normalizeType_(payload.type),
    name: safeString_(payload.name),
    icon: safeString_(payload.icon || 'circle-dollar-sign'),
    subCategories: uniqueStrings_(parseSubCategories_(payload.subCategories)),
    createdByEmail: safeString_(payload.createdByEmail || actorEmail),
    createdAt: safeString_(payload.createdAt || now),
    updatedAt: safeString_(payload.updatedAt || now),
  };

  if (!category.name) throw new Error('Category name is required.');
  if (!isCreate && !category.createdAt) category.createdAt = now;
  return category;
}

function getTransactionsByEmail_(email) {
  var target = normalizeEmail_(email);
  var sheet = ensureSheetWithHeaders_(MM.SHEETS.TRANSACTIONS, MM.HEADERS.TRANSACTIONS);
  var rows = getDataRows_(sheet, MM.HEADERS.TRANSACTIONS.length);
  var list = [];

  for (var i = 0; i < rows.length; i++) {
    var item = rowToObject_(rows[i], MM.HEADERS.TRANSACTIONS);
    if (!target || normalizeEmail_(item.createdByEmail) === target) {
      item.amount = Number(item.amount || 0);
      list.push(item);
    }
  }

  list.sort(function (a, b) {
    var aTime = new Date(a.date || a.timestamp).getTime();
    var bTime = new Date(b.date || b.timestamp).getTime();
    return bTime - aTime;
  });

  return list;
}

function getCategoriesAll_() {
  var sheet = ensureSheetWithHeaders_(MM.SHEETS.CATEGORIES, MM.HEADERS.CATEGORIES);
  var rows = getDataRows_(sheet, MM.HEADERS.CATEGORIES.length);
  var map = {};
  var result = [];

  for (var i = 0; i < rows.length; i++) {
    var item = rowToObject_(rows[i], MM.HEADERS.CATEGORIES);
    var normalized = categoryForClient_(item);
    var key = normalized.type + '::' + normalized.name.toLowerCase();
    if (!map[key]) {
      map[key] = normalized;
      result.push(normalized);
      continue;
    }

    map[key].icon = normalized.icon || map[key].icon;
    map[key].subCategories = uniqueStrings_(
      map[key].subCategories.concat(normalized.subCategories),
    );
  }

  result.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return result;
}

function categoryForClient_(item) {
  return {
    type: normalizeType_(item.type),
    name: safeString_(item.name),
    icon: safeString_(item.icon || 'circle-dollar-sign'),
    subCategories: uniqueStrings_(parseSubCategories_(item.subCategories)),
  };
}

function transactionsToCsv_(rows) {
  var headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Tag',
    'Category',
    'Sub Category',
    'Amount',
    'Short Description',
    'Created By',
    'Timestamp',
    'Narration',
  ];

  var lines = [headers.join(',')];
  for (var i = 0; i < rows.length; i++) {
    var item = rows[i];
    var narration = (
      safeString_(item.date) +
      ' | ' +
      safeString_(item.type) +
      ' | ' +
      safeString_(item.category) +
      ' ' +
      safeString_(item.subCategory) +
      ' | ' +
      safeString_(item.shortDescription)
    )
      .replace(/\s+/g, ' ')
      .trim();

    var line = [
      item.transactionId,
      item.date,
      item.type,
      item.tag,
      item.category,
      item.subCategory,
      item.amount,
      item.shortDescription,
      safeString_(item.createdByName) + ' <' + safeString_(item.createdByEmail) + '>',
      item.timestamp,
      narration,
    ].map(csvCell_);

    lines.push(line.join(','));
  }

  return lines.join('\n');
}

function csvCell_(value) {
  var text = String(value == null ? '' : value);
  if (/[",\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function resolveActorEmail_(payload, token, cfg) {
  var emailFromPayload = normalizeEmail_(payload.createdByEmail || payload.email);
  var email = emailFromPayload;

  if (cfg.requireTokenForMutations) {
    if (!token) throw new Error('Google token is required for this action.');
    var verified = cfg.verifyGoogleTokenOnMutation
      ? verifyGoogleIdToken_(token, emailFromPayload, cfg.googleClientIds)
      : decodeJwtPayload_(token);
    email = normalizeEmail_(verified.email || emailFromPayload);
  }

  if (!email) throw new Error('Could not resolve user email.');
  enforceApprovedEmail_(email, cfg);
  return email;
}

function verifyGoogleIdToken_(token, expectedEmail, allowedClientIds) {
  var response = UrlFetchApp.fetch(MM.TOKEN_INFO_URL + encodeURIComponent(token), {
    method: 'get',
    muteHttpExceptions: true,
  });
  var status = response.getResponseCode();
  if (status !== 200) {
    throw new Error('Invalid Google token.');
  }

  var data = JSON.parse(response.getContentText() || '{}');
  var email = normalizeEmail_(data.email);
  if (!email) throw new Error('Google token does not contain an email.');
  if (expectedEmail && email !== normalizeEmail_(expectedEmail)) {
    throw new Error('Token email does not match request email.');
  }

  if (!truthy_(data.email_verified)) {
    throw new Error('Google account email is not verified.');
  }

  var nowEpoch = Math.floor(Date.now() / 1000);
  var exp = Number(data.exp || 0);
  if (!exp || exp <= nowEpoch) {
    throw new Error('Google token is expired.');
  }

  if (allowedClientIds.length && allowedClientIds.indexOf(safeString_(data.aud)) === -1) {
    throw new Error('Token audience is not allowed for this app.');
  }

  var decoded = decodeJwtPayload_(token);
  return {
    email: email,
    aud: safeString_(data.aud),
    sub: safeString_(data.sub),
    name: safeString_(decoded.name),
    picture: safeString_(decoded.picture),
  };
}

function decodeJwtPayload_(token) {
  if (!token || token.split('.').length < 2) return {};
  try {
    var encoded = token.split('.')[1];
    var bytes = Utilities.base64DecodeWebSafe(encoded);
    var json = Utilities.newBlob(bytes).getDataAsString('UTF-8');
    return JSON.parse(json);
  } catch (err) {
    return {};
  }
}

function enforceApprovedEmail_(email, cfg) {
  if (!isEmailApproved_(email, cfg)) {
    throw new Error('Access denied. Your account is not approved.');
  }
}

function isEmailApproved_(email, cfg) {
  var target = normalizeEmail_(email);
  if (!target) return false;

  var userRow = findUserRowByEmail_(target);
  if (userRow) {
    return truthy_(userRow.approved);
  }

  if (cfg.approvedUsers.length) {
    return cfg.approvedUsers.indexOf(target) !== -1;
  }

  return cfg.allowAllIfNoApprovals;
}

function upsertUser_(email, name, picture, approved) {
  var sheet = ensureSheetWithHeaders_(MM.SHEETS.USERS, MM.HEADERS.USERS);
  var rows = getDataRows_(sheet, MM.HEADERS.USERS.length);
  var now = nowIso_();
  var updatedRows = [];
  var found = false;

  for (var i = 0; i < rows.length; i++) {
    var current = rowToObject_(rows[i], MM.HEADERS.USERS);
    if (normalizeEmail_(current.email) !== email) {
      updatedRows.push(rows[i]);
      continue;
    }

    found = true;
    current.name = safeString_(name || current.name);
    current.picture = safeString_(picture || current.picture);
    current.approved = approved ? 'TRUE' : current.approved;
    current.lastLoginAt = now;
    current.updatedAt = now;
    if (!current.role) current.role = 'user';
    updatedRows.push(objectToRow_(current, MM.HEADERS.USERS));
  }

  if (!found) {
    updatedRows.push(
      objectToRow_(
        {
          email: email,
          name: safeString_(name),
          picture: safeString_(picture),
          approved: approved ? 'TRUE' : 'FALSE',
          role: 'user',
          lastLoginAt: now,
          updatedAt: now,
        },
        MM.HEADERS.USERS,
      ),
    );
  }

  replaceSheetData_(sheet, MM.HEADERS.USERS.length, updatedRows);
}

function findUserRowByEmail_(email) {
  var sheet = ensureSheetWithHeaders_(MM.SHEETS.USERS, MM.HEADERS.USERS);
  var rows = getDataRows_(sheet, MM.HEADERS.USERS.length);
  var target = normalizeEmail_(email);

  for (var i = 0; i < rows.length; i++) {
    var item = rowToObject_(rows[i], MM.HEADERS.USERS);
    if (normalizeEmail_(item.email) === target) return item;
  }

  return null;
}

function getRuntimeConfig_() {
  var props = PropertiesService.getScriptProperties();
  var approvedUsersRaw = safeString_(props.getProperty('APPROVED_USERS'));
  var clientIdsRaw = safeString_(props.getProperty('GOOGLE_CLIENT_IDS'));

  return {
    approvedUsers: uniqueStrings_(
      approvedUsersRaw
        .split(',')
        .map(function (v) {
          return normalizeEmail_(v);
        })
        .filter(Boolean),
    ),
    allowAllIfNoApprovals: truthy_(props.getProperty('ALLOW_ALL_IF_NO_APPROVALS')),
    googleClientIds: uniqueStrings_(
      clientIdsRaw
        .split(',')
        .map(function (v) {
          return safeString_(v);
        })
        .filter(Boolean),
    ),
    verifyGoogleTokenOnVerifyUser: truthyWithDefault_(
      props.getProperty('VERIFY_GOOGLE_TOKEN_ON_VERIFY_USER'),
      true,
    ),
    verifyGoogleTokenOnMutation: truthyWithDefault_(
      props.getProperty('VERIFY_GOOGLE_TOKEN_ON_MUTATION'),
      true,
    ),
    requireTokenForMutations: truthyWithDefault_(
      props.getProperty('REQUIRE_TOKEN_FOR_MUTATIONS'),
      true,
    ),
  };
}

function ensureSchema_() {
  ensureSheetWithHeaders_(MM.SHEETS.TRANSACTIONS, MM.HEADERS.TRANSACTIONS);
  ensureSheetWithHeaders_(MM.SHEETS.CATEGORIES, MM.HEADERS.CATEGORIES);
  ensureSheetWithHeaders_(MM.SHEETS.USERS, MM.HEADERS.USERS);
}

function ensureSheetWithHeaders_(sheetName, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  var needsHeader = false;
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (safeString_(existing[i]) !== headers[i]) {
      needsHeader = true;
      break;
    }
  }

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = safeString_(props.getProperty('SPREADSHEET_ID'));
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getDataRows_(sheet, width) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, width).getValues();
}

function replaceSheetData_(sheet, width, rows) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, width).clearContent();
  }
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, width).setValues(rows);
  }
}

function rowToObject_(row, headers) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    var value = row[i];
    if (value instanceof Date) {
      if (key === 'date') {
        obj[key] = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        obj[key] = value.toISOString();
      }
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

function objectToRow_(obj, headers) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    var value = obj[key];

    if (key === 'subCategories') {
      if (Array.isArray(value)) {
        row.push(value.join('|'));
      } else {
        row.push(safeString_(value));
      }
      continue;
    }

    row.push(value == null ? '' : value);
  }
  return row;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function normalizeEmail_(email) {
  return safeString_(email).toLowerCase();
}

function normalizeType_(type) {
  return safeString_(type) === 'Money In' ? 'Money In' : 'Money Out';
}

function parseSubCategories_(value) {
  if (Array.isArray(value)) {
    return value
      .map(function (v) {
        return safeString_(v);
      })
      .filter(Boolean);
  }

  var text = safeString_(value);
  if (!text) return [];

  if (text.indexOf('|') >= 0) {
    return text
      .split('|')
      .map(function (v) {
        return safeString_(v);
      })
      .filter(Boolean);
  }

  if (text.indexOf(',') >= 0) {
    return text
      .split(',')
      .map(function (v) {
        return safeString_(v);
      })
      .filter(Boolean);
  }

  return [text];
}

function uniqueStrings_(arr) {
  var out = [];
  var map = {};
  for (var i = 0; i < arr.length; i++) {
    var item = safeString_(arr[i]);
    if (!item) continue;
    var key = item.toLowerCase();
    if (map[key]) continue;
    map[key] = true;
    out.push(item);
  }
  return out;
}

function safeString_(value) {
  if (value == null) return '';
  return String(value).trim();
}

function truthy_(value) {
  var text = safeString_(value).toLowerCase();
  return text === '1' || text === 'true' || text === 'yes' || text === 'y';
}

function truthyWithDefault_(value, fallback) {
  var text = safeString_(value).toLowerCase();
  if (!text) return fallback;
  return truthy_(text);
}

function toIsoDate_(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  var text = safeString_(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  var date = new Date(text);
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function nowIso_() {
  return new Date().toISOString();
}

function isObject_(value) {
  return Boolean(value) && Object.prototype.toString.call(value) === '[object Object]';
}
