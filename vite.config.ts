import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/  ·  https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app from /dst_dashboard/, not from the site root.
  base: '/dst_dashboard/',
  server: {
    // Listen on the home network too, so the phone can open the dev server.
    host: true,
  },
  test: {
    // Game rules are plain functions, so tests run in plain Node (no fake browser).
    environment: 'node',
  },
})
