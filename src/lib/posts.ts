import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { BlogPost } from './github'

const POSTS_DIR = path.join(process.cwd(), 'posts')

function calcReadTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function listLocalPosts(options?: { published?: boolean; tag?: string; search?: string; page?: number; limit?: number }) {
  const { published = true, tag, search, page = 1, limit = 10 } = options || {}

  if (!fs.existsSync(POSTS_DIR)) {
    return { posts: [] as BlogPost[], total: 0, totalPages: 0 }
  }

  let files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))

  let posts: BlogPost[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
    const { data, content: body } = matter(raw)
    return {
      id: file,
      title: data.title || 'Untitled',
      slug: data.slug || file.replace('.md', ''),
      excerpt: data.excerpt || '',
      content: body,
      tags: data.tags || '',
      published: data.published !== false,
      authorName: data.author || 'Anonymous',
      authorAvatar: null,
      githubUrl: null,
      readTime: calcReadTime(body),
      createdAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      updatedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    }
  })

  // Sort by date descending
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Filters
  if (published) posts = posts.filter((p) => p.published)
  if (tag) posts = posts.filter((p) => p.tags?.includes(tag))
  if (search) {
    const q = search.toLowerCase()
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q),
    )
  }

  const total = posts.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  posts = posts.slice(start, start + limit)

  return { posts, total, totalPages }
}

export function getLocalPost(slugOrId: string): BlogPost | null {
  const filePath = slugOrId.endsWith('.md')
    ? path.join(POSTS_DIR, slugOrId)
    : path.join(POSTS_DIR, `${slugOrId}.md`)

  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = matter(raw)
  return {
    id: path.basename(filePath),
    title: data.title || 'Untitled',
    slug: data.slug || path.basename(filePath, '.md'),
    excerpt: data.excerpt || '',
    content: body,
    tags: data.tags || '',
    published: data.published !== false,
    authorName: data.author || 'Anonymous',
    authorAvatar: null,
    githubUrl: null,
    readTime: calcReadTime(body),
    createdAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    updatedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
  }
}

export function saveLocalPost(
  slug: string,
  data: {
    title: string
    excerpt?: string
    content: string
    tags?: string
    published?: boolean
    authorName?: string
  },
): BlogPost {
  const frontmatter = {
    title: data.title,
    slug,
    excerpt: data.excerpt || null,
    tags: data.tags || null,
    author: data.authorName || 'Anonymous',
    published: data.published !== false,
    date: new Date().toISOString().split('T')[0],
  }

  const content = matter.stringify(data.content, frontmatter)

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }

  fs.writeFileSync(path.join(POSTS_DIR, `${slug}.md`), content, 'utf-8')

  return getLocalPost(slug)!
}

export function deleteLocalPost(slug: string): boolean {
  const filePath = path.join(POSTS_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}

export function getAllTags(): string[] {
  const { posts } = listLocalPosts({ published: true, limit: 999 })
  const tagSet = new Set<string>()
  posts.forEach((p) => {
    p.tags?.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => tagSet.add(t))
  })
  return Array.from(tagSet).sort()
}
