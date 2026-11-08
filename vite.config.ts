/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // La etiqueta debe estar en el HTML inicial para que el robot de AdSense la vea.
  // Vite carga .env y .env.production en el build (las variables VITE_ son públicas).
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const adsenseClient = env.VITE_ADSENSE_CLIENT?.trim();
  if (adsenseClient && !/^ca-pub-\d{16}$/.test(adsenseClient)) {
    throw new Error('VITE_ADSENSE_CLIENT debe tener el formato ca-pub- seguido de 16 dígitos.');
  }

  return {
  plugins: [
    react(),
    {
      name: 'adsense-verification',
      transformIndexHtml() {
        return adsenseClient
          ? { tags: [{ tag: 'meta', attrs: { name: 'google-adsense-account', content: adsenseClient }, injectTo: 'head' as const }] }
          : undefined;
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], supabase: ['@supabase/supabase-js'], zod: ['zod'] },
      },
    },
  },
  test: {
    globals: false,
    environment: 'node',
    environmentMatchGlobs: [['tests/ui/**', 'jsdom']],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
  };
});
