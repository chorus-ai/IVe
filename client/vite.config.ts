
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inside docker compose the API is another service, not localhost.
// Defaults to the host-side dev setup so running `npm run dev` is unchanged.
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false
      },
      '/docs': {
        target: apiTarget,
        changeOrigin: true,
        secure: false
      }
    },
  },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
})
