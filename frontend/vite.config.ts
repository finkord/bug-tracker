import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const backendDir = path.resolve(import.meta.dirname, '../backend');

  // Single Source of Truth: load administrator credentials from environment files
  const backendEnv = loadEnv(mode, backendDir, ['INITIAL_ADMIN_', 'VITE_']);
  const rootEnv = loadEnv(mode, rootDir, ['INITIAL_ADMIN_', 'VITE_']);
  const frontendEnv = loadEnv(mode, process.cwd(), ['INITIAL_ADMIN_', 'VITE_']);

  const merged = { ...rootEnv, ...backendEnv, ...frontendEnv };
  const adminEmail =
    process.env.INITIAL_ADMIN_EMAIL ||
    merged.INITIAL_ADMIN_EMAIL ||
    merged.VITE_INITIAL_ADMIN_EMAIL ||
    'admin@bugtracker.local';

  const adminPassword =
    process.env.INITIAL_ADMIN_PASSWORD ||
    merged.INITIAL_ADMIN_PASSWORD ||
    merged.VITE_INITIAL_ADMIN_PASSWORD ||
    'AdminPassword123!';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_INITIAL_ADMIN_EMAIL': JSON.stringify(mode === 'development' ? adminEmail : ''),
      'import.meta.env.VITE_INITIAL_ADMIN_PASSWORD': JSON.stringify(mode === 'development' ? adminPassword : ''),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/events': {
          target: 'http://localhost:3000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react-router-dom') || id.includes('/react/') || id.includes('/react-dom/')) {
                return 'vendor';
              }
              if (id.includes('@radix-ui')) {
                return 'radix';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              if (id.includes('@tanstack')) {
                return 'tanstack';
              }
            }
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
