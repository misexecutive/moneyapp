import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { verifyUser } from '../api/client';

const SESSION_KEY = 'money_manager_session_v1';

const AuthContext = createContext(null);

function parseJwt(credential) {
  if (!credential || typeof credential !== 'string') return null;
  const parts = credential.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );

    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function readSession() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSession(value) {
  if (typeof window === 'undefined') return;
  if (!value) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(value));
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const setAuthenticatedSession = useCallback((session) => {
    setStatus('authenticated');
    setUser(session.user);
    setToken(session.token);
    setError('');
    persistSession(session);
  }, []);

  const logout = useCallback(() => {
    setStatus('unauthenticated');
    setUser(null);
    setToken('');
    setError('');
    persistSession(null);
  }, []);

  const handleDenied = useCallback((message) => {
    setStatus('denied');
    setUser(null);
    setToken('');
    setError(message || 'Access denied. Your account is not approved.');
    persistSession(null);
  }, []);

  const loginWithGoogleCredential = useCallback(
    async (credentialResponse) => {
      const credential = credentialResponse?.credential;
      const parsed = parseJwt(credential);

      if (!parsed?.email) {
        handleDenied('Google login failed. Could not read your account details.');
        return {
          ok: false,
          error: 'Invalid Google token',
        };
      }

      const payload = {
        email: parsed.email,
        name: parsed.name,
        picture: parsed.picture,
      };

      const verifyResult = await verifyUser(payload, credential);
      if (!verifyResult.ok) {
        handleDenied(verifyResult.error);
        return verifyResult;
      }

      const session = {
        user: {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        },
        token: credential,
        verifiedAt: new Date().toISOString(),
      };

      setAuthenticatedSession(session);
      return {
        ok: true,
      };
    },
    [handleDenied, setAuthenticatedSession],
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const session = readSession();
      if (!session?.user?.email || !session?.token) {
        if (!active) return;
        setStatus('unauthenticated');
        return;
      }

      const verifyResult = await verifyUser(
        {
          email: session.user.email,
          name: session.user.name,
        },
        session.token,
      );

      if (!active) return;

      if (!verifyResult.ok) {
        handleDenied(verifyResult.error);
        return;
      }

      setAuthenticatedSession(session);
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [handleDenied, setAuthenticatedSession]);

  const value = useMemo(
    () => ({
      status,
      user,
      token,
      error,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      isDenied: status === 'denied',
      loginWithGoogleCredential,
      logout,
    }),
    [error, loginWithGoogleCredential, logout, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

