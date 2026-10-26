/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { supabase: ['@supabase/supabase-js'], react: ['react', 'react-dom', 'react-router-dom'], zod: ['zod'] },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // Las pruebas no dependen del .env.local de quien las ejecuta.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
