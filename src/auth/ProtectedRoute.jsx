import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card flex items-center gap-3 rounded-3xl px-5 py-4 text-sm text-slate-700"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your secure workspace...
        </motion.div>
      </div>
    );
  }

  if (auth.isDenied) {
    return <Navigate to="/login" replace state={{ denied: true, from: location.pathname }} />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

