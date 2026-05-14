/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Isola as dependências principais em um chunk de vendor (cache longo)
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Isolado para não bloquear o bundle principal
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})

