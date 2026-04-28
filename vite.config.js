import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function resolveBase(mode) {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.VITE_BASE_PATH) return env.VITE_BASE_PATH;

  const repository = process.env.GITHUB_REPOSITORY || env.GITHUB_REPOSITORY;
  if (!repository || mode !== 'production') return '/';

  const repoName = repository.split('/')[1];
  return repoName ? `/${repoName}/` : '/';
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: resolveBase(mode),
  server: {
    host: true,
  },
}));

