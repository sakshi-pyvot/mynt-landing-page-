#!/usr/bin/env node
// Derive card imagery for the Help Centre index from the synced articles.
// Reads src/help/catalog.ts + public/help-articles/**, writes src/help/media.json
// and 640px thumbs to public/help-thumbs/<id>.jpg (macOS `sips`).
// Run via scripts/sync-help.sh — never edit media.json by hand.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, openSync, readSync, closeSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUB = join(ROOT, 'public')
const THUMBS = join(PUB, 'help-thumbs')
mkdirSync(THUMBS, { recursive: true })

const catalog = readFileSync(join(ROOT, 'src/help/catalog.ts'), 'utf8')
const entries = [...catalog.matchAll(/id: '([^']+)', title: '(?:[^'\\]|\\.)*', category: '([^']+)', excerpt: '(?:[^'\\]|\\.)*', htmlPath: '([^']+)'/g)]
  .map(([, id, category, htmlPath]) => ({ id, category, htmlPath }))

// image size from file header (png IHDR / jpeg SOF), no deps
function dims(file) {
  const fd = openSync(file, 'r')
  try {
    const buf = Buffer.alloc(64 * 1024)
    const n = readSync(fd, buf, 0, buf.length, 0)
    if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
    let i = 2
    while (i < n) {
      if (buf[i] !== 0xff) return null
      const m = buf[i + 1]
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
      i += 2 + buf.readUInt16BE(i + 2)
    }
    return null
  } finally {
    closeSync(fd)
  }
}

let ffprobe = true
function seconds(file) {
  if (!ffprobe) return null
  try {
    return Math.round(parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString()))
  } catch {
    ffprobe = false
    return null
  }
}

const articles = {}
for (const { id, category, htmlPath } of entries) {
  const html = readFileSync(join(PUB, htmlPath), 'utf8')
  const base = dirname(htmlPath) // /help-articles/<folder>
  const abs = (rel) => `${base}/${rel}`
  const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1])
  const vid = html.match(/<video[^>]*>[\s\S]*?<\/video>/)
  const poster = vid?.[0].match(/poster="([^"]+)"/)?.[1]
  const src = vid?.[0].match(/src="([^"]+\.mp4)"/)?.[1]
  const mins = Number(html.match(/Read time: (\d+) minute/)?.[1]) || null

  let cover = null
  let cw = 0
  let ch = 0
  if (poster) {
    cover = poster
    ;({ w: cw, h: ch } = dims(join(PUB, abs(poster))) || {})
  } else {
    let best = 0
    for (const rel of imgs) {
      const d = dims(join(PUB, abs(rel)))
      if (!d || d.w < 300 || d.h < 40) continue // skip tiny badges; the UI letterboxes strips
      const score = d.w * d.h
      if (score > best) {
        best = score
        cover = rel
        cw = d.w
        ch = d.h
      }
    }
  }

  let thumb = null
  if (cover) {
    thumb = `/help-thumbs/${id}.jpg`
    execFileSync('sips', ['-Z', '640', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', join(PUB, abs(cover)), '--out', join(THUMBS, `${id}.jpg`)], { stdio: 'ignore' })
  }

  articles[id] = {
    category,
    cover: thumb,
    full: cover ? abs(cover) : null,
    w: cw || null,
    h: ch || null,
    ratio: cover ? +(cw / ch).toFixed(3) : null,
    video: src ? abs(src) : null,
    poster: poster ? abs(poster) : null,
    secs: src ? seconds(join(PUB, abs(src))) : null,
    mins,
    imgs: imgs.length,
  }
}

// one 16:9 cover per category: prefer a video poster, else the widest near-16:9 shot
const categories = {}
for (const [id, a] of Object.entries(articles)) {
  if (!a.cover) continue
  const near = Math.abs((a.ratio || 0) - 16 / 9)
  const score = (a.poster ? 10 : 0) - near
  if (!categories[a.category] || score > categories[a.category].score) categories[a.category] = { score, cover: a.cover, id }
}
for (const k of Object.keys(categories)) categories[k] = { cover: categories[k].cover, id: categories[k].id }

const out = join(ROOT, 'src/help/media.json')
writeFileSync(out, JSON.stringify({ articles, categories }, null, 1) + '\n')
const withCover = Object.values(articles).filter((a) => a.cover).length
const withVideo = Object.values(articles).filter((a) => a.video).length
console.log(`media.json: ${entries.length} articles, ${withCover} covers, ${withVideo} videos, ${Object.keys(categories).length} category covers${ffprobe ? '' : ' (no ffprobe: durations skipped)'}`)
if (!existsSync(out)) process.exit(1)
