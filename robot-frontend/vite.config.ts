import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // IMPORTANT: relative paths for offline use

  build: {
    outDir: "dist",
    assetsDir: "assets",

    // Force bundling everything (NO CDN)
    rollupOptions: {
      external: [], // nothing external
      output: {
        manualChunks: undefined, // optional: single bundle
      }
    }
  }
})
