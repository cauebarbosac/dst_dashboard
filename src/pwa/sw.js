// Service worker (M10): makes the app open with no connection.
//
// A service worker is a small script the browser keeps next to the page and
// runs on its own. Every request the page makes (HTML, JS, CSS, icons) goes
// through its `fetch` handler first, so it can answer from a local cache.
// Python analogy: a caching proxy in front of your own site.
//
// This file is a template: at build time, vite.config.ts fills in the list
// of files to save (PRECACHE) and a VERSION that changes with every deploy.
// It is written in plain JavaScript because the browser runs it as is.

const PRECACHE = /*__PRECACHE__*/ []
const VERSION = '__VERSION__'
const CACHE = `dst-dashboard-${VERSION}`
/** On slow Wi-Fi, stop waiting for the network after this long and open the saved copy. */
const NETWORK_TIMEOUT_MS = 3000

const scope = self.registration.scope // e.g. https://…/dst_dashboard/
const INDEX = new URL('./', scope).href

// Install: save the whole app (index page + every built file) right away,
// so the very next opening already works offline.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([INDEX, ...PRECACHE.map((f) => new URL(f, scope).href)]),
      )
      .then(() => self.skipWaiting()), // a new deploy takes over without closing the app
  )
})

// Activate: delete the caches of older deploys.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('dst-dashboard-') && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  if (!request.url.startsWith(scope)) return // other sites: leave alone
  if (request.mode === 'navigate') event.respondWith(openPage())
  else event.respondWith(savedFileFirst(request))
})

/**
 * Opening the app: try the network (to get the newest version), fall back
 * to the saved copy when offline or when the network is too slow.
 */
async function openPage() {
  const cache = await caches.open(CACHE)
  const fromNetwork = fetch(INDEX).then((response) => {
    if (response.ok) cache.put(INDEX, response.clone())
    return response
  })
  fromNetwork.catch(() => {}) // a late failure after the timeout is fine
  const tooSlow = new Promise((resolve) =>
    setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS),
  )

  try {
    const first = await Promise.race([fromNetwork, tooSlow])
    if (first) return first
  } catch {
    // offline: use the saved copy below
  }
  const saved = await cache.match(INDEX)
  return saved ?? fromNetwork // nothing saved yet: keep waiting for the network
}

/**
 * Built files (JS, CSS, icons) never change under the same name (the name
 * contains a hash of the content), so a saved copy is always right.
 */
async function savedFileFirst(request) {
  const cache = await caches.open(CACHE)
  const saved = await cache.match(request)
  if (saved) return saved
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}
