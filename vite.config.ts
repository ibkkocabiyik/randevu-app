import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const VERCEL_URL = process.env.VITE_API_URL ?? 'https://randevu-fawn.vercel.app';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: VERCEL_URL,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
