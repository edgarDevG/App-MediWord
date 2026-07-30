import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BACKEND_URL permite apuntar a una URL externa (ngrok, servidor, etc.)
// Por defecto usa el proxy local de desarrollo.
// Para ngrok: set VITE_BACKEND_URL=https://xxxx.ngrok-free.app antes de npm run dev
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Permite que ngrok y otros hosts externos accedan al dev server
    allowedHosts: 'all',
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        // Solo reescribir si el backend NO tiene prefijo /api
        // (el backend de MediWord sí usa /api/v1 — sin rewrite)
      }
    }
  }
})
