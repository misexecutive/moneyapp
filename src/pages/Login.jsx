import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Lock, ShieldAlert, WalletCards } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

const HAS_GOOGLE_CLIENT_ID = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (auth.isAuthenticated) {
      const fallbackRoute = '/dashboard';
      const from = location.state?.from || fallbackRoute;
      navigate(from, { replace: true });
    }
  }, [auth.isAuthenticated, location.state?.from, navigate]);

  const denied = auth.isDenied || location.state?.denied;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.25),transparent_38%),linear-gradient(180deg,#f8fbff,#eef5ff)]" />
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card relative z-10 w-full max-w-sm rounded-[2rem] p-5"
      >
        <div className="mb-5 flex items-center justify-center">
          <span className="inline-flex rounded-2xl bg-blue-600 p-3 text-white shadow-soft">
            {denied ? <ShieldAlert size={20} /> : <WalletCards size={20} />}
          </span>
        </div>

        {denied ? (
          <>
            <h1 className="text-center text-xl font-bold tracking-tight text-slate-900">Access Denied</h1>
            <p className="mt-2 text-center text-sm text-slate-600">{auth.error || 'Your Google account is not approved for this workspace.'}</p>
            <button
              type="button"
              onClick={auth.logout}
              className="btn-primary mt-5 w-full justify-center"
            >
              Try another account
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">Money Manager</p>
            <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900">Secure Finance Dashboard</h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              Sign in with Google to access your Sheets-backed personal ledger.
            </p>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-[12px] text-blue-900">
              <p className="font-semibold">Secure access</p>
              <p className="mt-1 flex items-center gap-1.5 text-blue-700">
                <Lock size={12} /> Only approved Google users can enter.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              {HAS_GOOGLE_CLIENT_ID ? (
                <GoogleLogin
                  shape="pill"
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                  onSuccess={async (credentialResponse) => {
                    const result = await auth.loginWithGoogleCredential(credentialResponse);
                    if (!result.ok) {
                      setLocalError(result.error || 'Sign in failed');
                    }
                  }}
                  onError={() => {
                    setLocalError('Google authentication failed. Please retry.');
                  }}
                />
              ) : (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
                  Missing `VITE_GOOGLE_CLIENT_ID` in environment.
                </p>
              )}
            </div>

            {localError ? <p className="mt-3 text-center text-xs text-rose-600">{localError}</p> : null}
          </>
        )}
      </motion.section>
    </main>
  );
}

