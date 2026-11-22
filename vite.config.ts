import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import {
  buildServiceWorker,
  type BuiltFile,
} from './src/pwa/buildServiceWorker.ts'

/**
 * M10: after `vite build`, write dist/sw.js from the template in src/pwa/,
 * with the list of built files to save for offline use.
 */
function serviceWorker(): Plugin {
  let outDir = 'dist'
  return {
    name: 'dst-service-worker',
    apply: 'build', // the dev server has no service worker (it would cache stale code)
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const files: BuiltFile[] = readdirSync(outDir, {
        recursive: true,
        withFileTypes: true,
      })
        .filter((e) => e.isFile())
        .map((e) => {
          const full = join(e.parentPath, e.name)
          return { path: relative(outDir, full), content: readFileSync(full) }
        })
      const template = readFileSync('src/pwa/sw.js', 'utf8')
      writeFileSync(join(outDir, 'sw.js'), buildServiceWorker(template, files))
    },
  }
}

// https://vite.dev/config/  ·  https://vitest.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
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
