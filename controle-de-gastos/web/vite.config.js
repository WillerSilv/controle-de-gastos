import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Em desenvolvimento usamos "/"; no GitHub Pages o workflow informa o nome do repositório.
  base: process.env.VITE_BASE_PATH || '/',
  server: { port: 5173 },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
