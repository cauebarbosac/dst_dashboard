// `npm run test:live` only (M11): the live tests against the real Firebase
// project, which `npm test` skips. Same settings as vite.config.ts, plus the
// switch that turns them on.
import { defineConfig, mergeConfig } from 'vitest/config'
import base from './vite.config.ts'

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ['tests/live/**/*.test.ts'],
      env: { LIVE_FIREBASE: '1' },
      fileParallelism: false,
    },
  }),
)
