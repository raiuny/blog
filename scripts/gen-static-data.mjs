// Generate public/posts.json for the GitHub Pages static mirror.
// Reads published posts from Turso (DATABASE_URL / DATABASE_AUTH_TOKEN).
import { createClient } from '@libsql/client'
import { writeFileSync, mkdirSync } from 'node:fs'
import { loadEnv } from './lib/env.mjs'

loadEnv()

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN })
const { rows } = await client.execute(
  'SELECT * FROM "Post" WHERE "published" = 1 ORDER BY "createdAt" DESC'
)

function calcReadTime(content) {
  const words = String(content).split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

const posts = rows.map((r) => ({
  id: r.slug,
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt || '',
  content: r.content,
  tags: r.tags || '',
  published: true,
  authorName: r.authorName,
  authorAvatar: null,
  githubUrl: null,
  readTime: calcReadTime(r.content),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}))

mkdirSync('public', { recursive: true })
writeFileSync(
  'public/posts.json',
  JSON.stringify({ posts, pagination: { page: 1, limit: 99999, total: posts.length, totalPages: 1 } })
)
console.log(`Wrote ${posts.length} published post(s) to public/posts.json`)
