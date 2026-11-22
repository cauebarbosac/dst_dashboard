// This test reads real files (the service worker, manifest, icons) from disk.
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildServiceWorker,
  buildVersion,
  precacheList,
  type BuiltFile,
} from '../../src/pwa/buildServiceWorker'
import {
  createKeepAwake,
  type WakeLockEnv,
  type WakeLockHandle,
} from '../../src/pwa/wakeLock'
import { createLocalStore, type KeyValueStorage } from '../../src/storage/store'

const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root))
const file = (path: string, content = path): BuiltFile => ({
  path,
  content: new TextEncoder().encode(content),
})

// ─────────────────────────────────────────────────────────────────────────
describe('M10 building the service worker', () => {
  const template = read('src/pwa/sw.js').toString('utf8')

  it('saves every built file except itself, index.html and source maps', () => {
    const files = [
      file('index.html'),
      file('sw.js'),
      file('assets/index-abc.js'),
      file('assets/index-abc.js.map'),
      file('assets/index-def.css'),
      file('icon-192.png'),
      file('manifest.webmanifest'),
    ]
    expect(precacheList(files)).toEqual([
      'assets/index-abc.js',
      'assets/index-def.css',
      'icon-192.png',
      'manifest.webmanifest',
    ])
  })

  it('uses web slashes even when built on Windows', () => {
    expect(precacheList([file('assets\\index-abc.js')])).toEqual([
      'assets/index-abc.js',
    ])
  })

  it('the version changes when any file changes, so phones update', () => {
    const before = buildVersion([
      file('a.js', 'one'),
      file('manifest.webmanifest', 'x'),
    ])
    const after = buildVersion([
      file('a.js', 'one'),
      file('manifest.webmanifest', 'y'),
    ])
    expect(after).not.toBe(before)
  })

  it('the version is the same for the same files, in any order', () => {
    const a = [file('a.js'), file('b.css')]
    expect(buildVersion(a)).toBe(buildVersion([...a].reverse()))
  })

  it('fills the list and version into the template', () => {
    const sw = buildServiceWorker(template, [file('assets/x.js')])
    expect(sw).toContain('const PRECACHE = ["assets/x.js"]')
    expect(sw).not.toContain('__VERSION__')
    expect(sw).not.toContain('__PRECACHE__')
  })

  it('refuses a template without its placeholders', () => {
    expect(() => buildServiceWorker('const x = 1', [])).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Runs src/pwa/sw.js against fake browser parts.

const SCOPE = 'https://example.test/dst_dashboard/'
const INDEX = SCOPE

type FakeRequest = { url: string; method: string; mode: string }
type Listener = (event: unknown) => void

function loadServiceWorker(precache: string[] = ['assets/app.js']) {
  const code = buildServiceWorker(
    read('src/pwa/sw.js').toString('utf8'),
    precache.map((p) => file(p)),
  )
  const stores = new Map<string, Map<string, Response>>()
  const listeners: Record<string, Listener> = {}
  const self = {
    registration: { scope: SCOPE },
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
    addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
  }
  const keyOf = (r: string | FakeRequest) => (typeof r === 'string' ? r : r.url)
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)!
      return {
        addAll: async (urls: string[]) =>
          urls.forEach((u) => store.set(u, new Response(`saved ${u}`))),
        put: async (r: string | FakeRequest, res: Response) =>
          void store.set(keyOf(r), res),
        match: async (r: string | FakeRequest) => store.get(keyOf(r))?.clone(),
      }
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  }
  // The network: by default online and answering instantly.
  const network = {
    mode: 'online' as 'online' | 'offline' | 'slow',
  }
  const fetch = vi.fn((r: string | FakeRequest) => {
    const url = keyOf(r)
    if (network.mode === 'offline')
      return Promise.reject(new TypeError('offline'))
    const res = new Response(`fresh ${url}`)
    if (network.mode === 'slow')
      return new Promise<Response>((ok) => setTimeout(() => ok(res), 10_000))
    return Promise.resolve(res)
  })

  new Function('self', 'caches', 'fetch', 'setTimeout', code)(
    self,
    caches,
    fetch,
    setTimeout,
  )

  async function lifecycle(type: 'install' | 'activate') {
    const waits: Promise<unknown>[] = []
    listeners[type]({ waitUntil: (p: Promise<unknown>) => waits.push(p) })
    await Promise.all(waits)
  }

  /** Sends a request through the worker; null = it let the browser handle it. */
  function request(url: string, opts: Partial<FakeRequest> = {}) {
    let answer: Promise<Response> | null = null
    listeners.fetch({
      request: { url, method: 'GET', mode: 'no-cors', ...opts },
      respondWith: (p: Promise<Response>) => (answer = p),
    })
    return answer as Promise<Response> | null
  }

  const currentCache = () =>
    [...stores.entries()].find(([k]) => k.startsWith('dst-dashboard-'))!

  return { self, stores, network, fetch, lifecycle, request, currentCache }
}

describe('M10 service worker (opening offline)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('on install, saves the app page and every built file, then takes over', async () => {
    const sw = loadServiceWorker(['assets/app.js', 'icon-192.png'])
    await sw.lifecycle('install')
    const [, saved] = sw.currentCache()
    expect([...saved.keys()].sort()).toEqual([
      INDEX,
      `${SCOPE}assets/app.js`,
      `${SCOPE}icon-192.png`,
    ])
    expect(sw.self.skipWaiting).toHaveBeenCalled()
  })

  it('on activate, deletes older versions but not other sites’ caches', async () => {
    const sw = loadServiceWorker()
    sw.stores.set('dst-dashboard-old', new Map())
    sw.stores.set('something-else', new Map())
    await sw.lifecycle('install')
    await sw.lifecycle('activate')
    const names = [...sw.stores.keys()]
    expect(names).not.toContain('dst-dashboard-old')
    expect(names).toContain('something-else')
    expect(names.filter((n) => n.startsWith('dst-dashboard-'))).toHaveLength(1)
    expect(sw.self.clients.claim).toHaveBeenCalled()
  })

  it('opening the app online gets the newest page and saves it', async () => {
    const sw = loadServiceWorker()
    await sw.lifecycle('install')
    const res = await sw.request(INDEX, { mode: 'navigate' })!
    expect(await res.text()).toBe(`fresh ${INDEX}`)
    const [, saved] = sw.currentCache()
    expect(await saved.get(INDEX)!.clone().text()).toBe(`fresh ${INDEX}`)
  })

  it('opening the app with Wi-Fi off shows the saved page', async () => {
    const sw = loadServiceWorker()
    await sw.lifecycle('install')
    sw.network.mode = 'offline'
    const res = await sw.request(`${INDEX}?source=homescreen`, {
      mode: 'navigate',
    })!
    expect(await res.text()).toBe(`saved ${INDEX}`)
  })

  it('on very slow Wi-Fi, gives up on the network after 3 s and shows the saved page', async () => {
    const sw = loadServiceWorker()
    await sw.lifecycle('install')
    sw.network.mode = 'slow'
    const answer = sw.request(INDEX, { mode: 'navigate' })!
    let done = false
    void answer.then(() => (done = true))
    await vi.advanceTimersByTimeAsync(2900)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(200)
    expect(await (await answer).text()).toBe(`saved ${INDEX}`)
  })

  it('built files come from the saved copy, without using the network', async () => {
    const sw = loadServiceWorker(['assets/app.js'])
    await sw.lifecycle('install')
    sw.fetch.mockClear()
    const res = await sw.request(`${SCOPE}assets/app.js`)!
    expect(await res.text()).toBe(`saved ${SCOPE}assets/app.js`)
    expect(sw.fetch).not.toHaveBeenCalled()
  })

  it('a file not saved yet is fetched and saved for next time', async () => {
    const sw = loadServiceWorker([])
    await sw.lifecycle('install')
    const url = `${SCOPE}assets/new.js`
    expect(await (await sw.request(url)!).text()).toBe(`fresh ${url}`)
    sw.network.mode = 'offline'
    expect(await (await sw.request(url)!).text()).toBe(`fresh ${url}`)
  })

  it('leaves other sites and non-GET requests alone', async () => {
    const sw = loadServiceWorker()
    await sw.lifecycle('install')
    expect(sw.request('https://other.test/api')).toBeNull()
    expect(sw.request(`${SCOPE}save`, { method: 'POST' })).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('M10 keep screen awake', () => {
  /** A fake browser: wake lock + whether the app is on screen. */
  function fakeBrowser({ supported = true, refuse = false } = {}) {
    let visible = true
    const listeners = new Set<() => void>()
    const locks: { released: boolean; onRelease: (() => void)[] }[] = []
    const env: WakeLockEnv = {
      request: supported
        ? vi.fn(async (): Promise<WakeLockHandle> => {
            if (refuse) throw new Error('NotAllowedError')
            const lock = { released: false, onRelease: [] as (() => void)[] }
            locks.push(lock)
            return {
              release: async () => {
                lock.released = true
              },
              addEventListener: (_type, fn) => void lock.onRelease.push(fn),
            }
          })
        : null,
      isVisible: () => visible,
      onVisibilityChange: (fn) => {
        listeners.add(fn)
        return () => listeners.delete(fn)
      },
    }
    return {
      env,
      locks,
      listenerCount: () => listeners.size,
      /** Phone goes to home screen: the browser drops the lock itself. */
      hide() {
        visible = false
        for (const l of locks.filter((l) => !l.released)) {
          l.released = true
          l.onRelease.forEach((fn) => fn())
        }
        listeners.forEach((fn) => fn())
      },
      show() {
        visible = true
        listeners.forEach((fn) => fn())
      },
    }
  }
  const settle = () => new Promise((r) => setTimeout(r, 0))

  it('switched on: the screen is kept awake', async () => {
    const b = fakeBrowser()
    const k = createKeepAwake(b.env)
    k.setWanted(true)
    await settle()
    expect(k.isHeld()).toBe(true)
    expect(b.locks).toHaveLength(1)
  })

  it('switched off: the lock is let go', async () => {
    const b = fakeBrowser()
    const k = createKeepAwake(b.env)
    k.setWanted(true)
    await settle()
    k.setWanted(false)
    await settle()
    expect(k.isHeld()).toBe(false)
    expect(b.locks[0].released).toBe(true)
  })

  it('after leaving the app and coming back, it asks again', async () => {
    const b = fakeBrowser()
    const k = createKeepAwake(b.env)
    k.setWanted(true)
    await settle()
    b.hide()
    expect(k.isHeld()).toBe(false)
    b.show()
    await settle()
    expect(k.isHeld()).toBe(true)
    expect(b.locks).toHaveLength(2)
  })

  it('does not ask while the app is hidden', async () => {
    const b = fakeBrowser()
    const k = createKeepAwake(b.env)
    b.hide()
    k.setWanted(true)
    await settle()
    expect(b.env.request).not.toHaveBeenCalled()
  })

  it('a quick double switch-on asks only once', async () => {
    const b = fakeBrowser()
    const k = createKeepAwake(b.env)
    k.setWanted(true)
    k.setWanted(true)
    await settle()
    expect(b.locks).toHaveLength(1)
  })

  it('switched off while the browser is still answering: the late lock is let go', async () => {
    const b = fakeBrowser()
    const k = createKeepAwake(b.env)
    k.setWanted(true)
    k.setWanted(false)
    await settle()
    expect(k.isHeld()).toBe(false)
    expect(b.locks[0].released).toBe(true)
  })

  it('a refused request is not an error, and is retried when the app is shown again', async () => {
    const b = fakeBrowser({ refuse: true })
    const k = createKeepAwake(b.env)
    k.setWanted(true)
    await settle()
    expect(k.isHeld()).toBe(false)
    b.show()
    await settle()
    expect(b.env.request).toHaveBeenCalledTimes(2)
  })

  it('a browser without wake lock: reported unsupported, nothing breaks', () => {
    const k = createKeepAwake(fakeBrowser({ supported: false }).env)
    expect(k.supported).toBe(false)
    k.setWanted(true)
    expect(k.isHeld()).toBe(false)
  })

  it('dispose lets go of the lock and stops listening', async () => {
    const b = fakeBrowser()
    const k = createKeepAwake(b.env)
    k.setWanted(true)
    await settle()
    k.dispose()
    await settle()
    expect(b.locks[0].released).toBe(true)
    expect(b.listenerCount()).toBe(0)
  })
})

describe('M10 keep-awake setting is remembered on this phone', () => {
  function fakeStorage(): KeyValueStorage {
    const data = new Map<string, string>()
    return {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    }
  }

  it('is on by default', () => {
    expect(createLocalStore(fakeStorage()).loadKeepAwake()).toBe(true)
  })

  it('remembers "off" across restarts', () => {
    const storage = fakeStorage()
    createLocalStore(storage).saveKeepAwake(false)
    expect(createLocalStore(storage).loadKeepAwake()).toBe(false)
    createLocalStore(storage).saveKeepAwake(true)
    expect(createLocalStore(storage).loadKeepAwake()).toBe(true)
  })

  it('without working storage, it is simply on', () => {
    expect(createLocalStore(null).loadKeepAwake()).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('M10 installing (manifest and icons)', () => {
  const manifest = JSON.parse(
    read('public/manifest.webmanifest').toString('utf8'),
  )

  /** Width and height from a PNG's header. */
  function pngSize(path: string): [number, number] {
    const png = read(path)
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG')
    return [png.readUInt32BE(16), png.readUInt32BE(20)]
  }

  it('opens fullscreen, in portrait', () => {
    expect(manifest.display).toBe('fullscreen')
    expect(manifest.orientation).toBe('portrait')
  })

  it('uses relative addresses, so it works under /dst_dashboard/', () => {
    for (const key of ['start_url', 'scope', 'id'])
      expect(manifest[key]).toBe('./')
    for (const icon of manifest.icons) expect(icon.src).not.toMatch(/^\//)
  })

  it('has a name and the app’s background color', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name.length).toBeLessThanOrEqual(12) // fits under the icon
    expect(manifest.background_color).toBe('#1b1712')
  })

  it('has 192 and 512 icons (needed to install), plus a maskable one', () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(
      manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable'),
    ).toBe(true)
  })

  it('every icon file exists with the size it claims', () => {
    for (const icon of manifest.icons) {
      const [w, h] = icon.sizes.split('x').map(Number)
      expect(pngSize(`public/${icon.src}`)).toEqual([w, h])
    }
    expect(pngSize('public/apple-touch-icon.png')).toEqual([180, 180])
  })

  it('the page links the manifest and the iPhone icon', () => {
    const html = read('index.html').toString('utf8')
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
    expect(html).toContain(
      'rel="apple-touch-icon" href="/apple-touch-icon.png"',
    )
  })
})
