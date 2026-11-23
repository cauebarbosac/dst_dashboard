// Uploads the pictures in private-assets/ to Firebase (M12).
// Run by hand, like `python scripts/upload_art.py`:
//
//   npm run art:check    → what's there, what's missing (uploads nothing)
//   npm run art:upload   → writes art/characters and art/items
//
// Needs the admin key at private-assets/service-account.json (Firebase
// console → Project settings → Service accounts → Generate new private key).
// The key and the pictures are git-ignored: never commit them.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { ART_GROUPS, packArt, type ArtFile } from '../src/logic/art'

const ROOT = 'private-assets'
const KEY = join(ROOT, 'service-account.json')
const upload = process.argv.includes('--upload')

const files: ArtFile[] = ART_GROUPS.flatMap((group) => {
  const dir = join(ROOT, group)
  if (!existsSync(dir)) return []
  return readdirSync(dir).map((fileName) => ({
    group,
    fileName,
    base64: readFileSync(join(dir, fileName)).toString('base64'),
  }))
})

const result = packArt(files)

for (const group of ART_GROUPS) {
  const have = Object.keys(result.docs[group]).length
  const kb = Math.round(JSON.stringify(result.docs[group]).length / 1024)
  console.log(`\n${group}: ${have} pictures, ${kb} KB`)
  const missing = result.missing[group]
  console.log(
    missing.length
      ? `  missing (${missing.length}): ${missing.join(', ')}`
      : '  nothing missing',
  )
}
if (result.unused.length)
  console.log(`\nnot used by the game data: ${result.unused.join(', ')}`)
if (result.skipped.length)
  console.log(
    `skipped (not a picture or a duplicate): ${result.skipped.join(', ')}`,
  )

if (result.tooBig.length) {
  console.error(`\nToo big for one document: ${result.tooBig.join(', ')}.`)
  process.exit(1)
}

if (!upload) {
  console.log('\nCheck only. Run `npm run art:upload` to send them.')
  process.exit(0)
}

if (!existsSync(KEY)) {
  console.error(
    `\nNo admin key at ${KEY}.\n` +
      'Firebase console → Project settings → Service accounts → ' +
      'Generate new private key, and save it there.',
  )
  process.exit(1)
}

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY, 'utf8'))) })
const db = getFirestore()
for (const group of ART_GROUPS) {
  // Replaces the whole group: a picture deleted locally goes away too.
  await db.doc(`art/${group}`).set(result.docs[group])
  console.log(`uploaded art/${group}`)
}
