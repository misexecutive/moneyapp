# Money Manager

A premium, mobile-first React money tracking app with Google OAuth, Google Sheets backend integration via Apps Script APIs, compact transaction entry, analytics dashboard, categories, filters, recurring expense detection, and CSV export.

## Features

- Google OAuth login (`@react-oauth/google`) with backend user verification (`verifyUser`)
- Access-denied flow for unauthorized users
- Google Apps Script API client with required action contract
- Mobile-first dashboard with cards, pie charts, daily/monthly trends, top spend, recurring detector
- Compact add-entry flow with type-based category/sub-category selection
- Category manager with icon mapping and optional sub-categories
- Transaction list with filters, search, edit, delete confirmation
- Export all transactions as CSV
- Smooth motion/overlay animations (`framer-motion`)
- Tailwind + glassmorphism blue/white premium UI
- GitHub Pages deployment workflow

## Stack

- React + Vite + JavaScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React icons
- React Router

## Environment Setup

Copy `.env.example` to `.env`:

```env
VITE_API_BASE=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
VITE_APPROVED_USERS=you@example.com
```

`VITE_APPROVED_USERS` is an optional fallback allowlist used when backend is unavailable.

## Backend Contract (Apps Script)

Frontend expects response format:

```json
{ "ok": true, "data": ... }
```

or

```json
{ "ok": false, "error": "Message here" }
```

### Supported actions

- `getBootstrapData`
- `getTransactions`
- `addTransaction`
- `updateTransaction`
- `deleteTransaction`
- `getCategories`
- `addCategory`
- `exportTransactions`
- `verifyUser`

### POST payload format

```json
{
  "action": "addTransaction",
  "payload": { "...": "..." },
  "token": "google_id_token_if_available"
}
```

### GET query format

```txt
?action=getTransactions&email=user@example.com
```

## Data Schema (Transaction)

- `transactionId`
- `timestamp`
- `date`
- `type` (`Money In` / `Money Out`)
- `category`
- `subCategory`
- `amount`
- `shortDescription`
- `tag` (`Receivable` / `Payable`)
- `createdByEmail`
- `createdByName`
- `updatedAt`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages Deployment

1. Push to `main`.
2. Ensure repo Pages source is GitHub Actions.
3. Set repo secrets/variables if needed for environment values.
4. Workflow file: `.github/workflows/deploy.yml`.

`vite.config.js` automatically sets base path for production from `GITHUB_REPOSITORY`, or you can override with `VITE_BASE_PATH`.

## Google OAuth Notes

- Create OAuth client in Google Cloud Console.
- Add your dev/prod origins to authorized JavaScript origins.
- Set client ID in `VITE_GOOGLE_CLIENT_ID`.
- Backend should verify Google token/email and return approved status.

