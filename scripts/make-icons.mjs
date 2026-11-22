// Draws the home-screen icons (M10) as PNG files in public/.
// Run once with `node scripts/make-icons.mjs`; the PNGs are committed.
// No image library: a PNG is just zlib-compressed rows of pixels plus a
// few checksummed "chunks", so Node's built-in zlib is enough.
// Placeholder art until the images milestone (M12): a warm ring with a
// campfire dot on the app's dark background.

import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x1b, 0x17, 0x12] // --bg
const ACCENT = [0xe0, 0xa8, 0x4a] // --accent
const EMBER = [0xe8, 0x8a, 0x3a] // --ring-orange

// Shapes, as fractions of the icon size. Everything stays inside the
// middle 80% so Android's "maskable" crop (circle, squircle…) never cuts it.
function colorAt(x, y) {
  const d = Math.hypot(x - 0.5, y - 0.5)
  if (d >= 0.26 && d <= 0.34) return ACCENT // ring
  if (d <= 0.14) return EMBER // campfire dot
  return BG
}

function render(size) {
  const SS = 4 // supersampling: 4×4 samples per pixel for smooth edges
  const rows = []
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 3) // 1 filter byte, then RGB
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0]
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const c = colorAt(
            (px + (sx + 0.5) / SS) / size,
            (py + (sy + 0.5) / SS) / size,
          )
          for (let i = 0; i < 3; i++) sum[i] += c[i]
        }
      for (let i = 0; i < 3; i++)
        row[1 + px * 3 + i] = Math.round(sum[i] / (SS * SS))
    }
    rows.push(row)
  }
  return png(size, size, Buffer.concat(rows))
}

function png(width, height, raw) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bits per channel
  header[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) {
    c ^= byte
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180], // iPhone home screen
]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), render(size))
  console.log(`public/${name} (${size}×${size})`)
}
