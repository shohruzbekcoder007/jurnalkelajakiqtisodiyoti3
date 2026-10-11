import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = {
  '/api': 'http://localhost:5000',
  '/uploads': 'http://localhost:5000',
};

export default defineConfig({
  plugins: [react()],
  server: {
    // Lokal tarmoqdagi boshqa kompyuterlardan ham ochilishi uchun (0.0.0.0)
    host: true,
    port: 5173,
    proxy,
  },
  preview: {
    host: true,
    port: 4173,
    proxy,
  },
});
