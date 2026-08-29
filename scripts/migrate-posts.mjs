// Sync posts/*.md into the Post table (local file DB or remote Turso).
// Usage: node scripts/migrate-posts.mjs [--drop]
//   DATABASE_URL        file:... (local) or libsql://... (Turso)
//   DATABASE_AUTH_TOKEN required for libsql://
//   --drop              recreate the Post table (destroys remote data)
import { createClient } from '@libsql/client'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv } from './lib/env.mjs'

loadEnv()

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const POSTS_DIR = join(process.cwd(), 'posts')

function calcReadTime(content) {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function parsePost(file) {
  const raw = readFileSync(join(POSTS_DIR, file), 'utf-8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  const body = match ? raw.slice(match[0].length) : raw
  const fm = {}
  if (match) {
    for (const line of match[1].split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/)
      if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return {
    title: fm.title || 'Untitled',
    slug: fm.slug || file.replace(/\.md$/, ''),
    excerpt: fm.excerpt || null,
    content: body.trim(),
    tags: fm.tags || '',
    published: fm.published !== 'false',
    authorName: fm.author || 'Anonymous',
    readTime: calcReadTime(body),
    createdAt: fm.date ? new Date(fm.date).toISOString() : new Date().toISOString(),
  }
}

const DDL = `
CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT NOT NULL DEFAULT 'Anonymous',
    "authorAvatar" TEXT,
    "githubUrl" TEXT,
    "readTime" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post" ("slug");
`

if (process.argv.includes('--drop')) {
  await client.execute('DROP TABLE IF EXISTS "Post"')
}

await client.batch(DDL.split(';').filter((s) => s.trim()).map((sql) => ({ sql, args: [] })), 'write')

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))
let upserted = 0

for (const file of files) {
  const p = parsePost(file)
  await client.execute({
    sql: `INSERT INTO "Post" ("id","title","slug","excerpt","content","tags","published","authorName","readTime","createdAt","updatedAt")
          VALUES (lower(hex(randomblob(12))),?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT("slug") DO UPDATE SET
            "title"=excluded."title", "excerpt"=excluded."excerpt", "content"=excluded."content",
            "tags"=excluded."tags", "published"=excluded."published", "authorName"=excluded."authorName",
            "readTime"=excluded."readTime", "updatedAt"=excluded."createdAt"`,
    args: [p.title, p.slug, p.excerpt, p.content, p.tags, p.published, p.authorName, p.readTime, p.createdAt, p.createdAt],
  })
  upserted++
}

const { rows } = await client.execute('SELECT COUNT(*) AS n FROM "Post"')
console.log(`Synced ${upserted} markdown files from ${POSTS_DIR}; table now has ${rows[0].n} rows at ${url.replace(/\/\/.*@/, '//***@')}`)
