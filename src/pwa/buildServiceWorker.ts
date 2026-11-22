// Fills in the service worker template (src/pwa/sw.js) at build time (M10).
// Pure function: vite.config.ts reads the built files and hands them over,
// so this can be tested without running a build.

export type BuiltFile = { path: string; content: Uint8Array }

/** Built files the service worker must not save. */
function skip(path: string): boolean {
  return (
    path === 'sw.js' || // itself: the browser updates it on its own
    path === 'index.html' || // saved under the app's address instead
    path.endsWith('.map')
  )
}

/** Paths (relative to the app's folder, with `/`) to save at install. */
export function precacheList(files: BuiltFile[]): string[] {
  return files
    .map((f) => f.path.replaceAll('\\', '/'))
    .filter((p) => !skip(p))
    .sort()
}

/**
 * A short fingerprint of every built file (names and contents). Any change
 * in a deploy gives a new version, which makes phones fetch it fresh.
 */
export function buildVersion(files: BuiltFile[]): string {
  // FNV-1a, 32 bit: a tiny, well-known non-cryptographic hash.
  let h = 0x811c9dc5
  const eat = (byte: number) => {
    h ^= byte
    h = Math.imul(h, 0x01000193) >>> 0
  }
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : 1))
  for (const f of sorted) {
    for (const b of new TextEncoder().encode(f.path)) eat(b)
    eat(0)
    for (const b of f.content) eat(b)
    eat(0)
  }
  return h.toString(16).padStart(8, '0')
}

export function buildServiceWorker(
  template: string,
  files: BuiltFile[],
): string {
  if (
    !template.includes('/*__PRECACHE__*/ []') ||
    !template.includes('__VERSION__')
  )
    throw new Error('service worker template is missing its placeholders')
  return template
    .replace('/*__PRECACHE__*/ []', JSON.stringify(precacheList(files)))
    .replace('__VERSION__', buildVersion(files))
}
