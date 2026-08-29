import type { Post } from '@prisma/client'
import { db } from './db'
import type { BlogPost } from './github'

function calcReadTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function toBlogPost(p: Post): BlogPost {
  return {
    id: p.slug,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || '',
    content: p.content,
    tags: p.tags,
    published: p.published,
    authorName: p.authorName,
    authorAvatar: null,
    githubUrl: null,
    readTime: calcReadTime(p.content),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export async function listLocalPosts(options?: {
  published?: boolean
  tag?: string
  search?: string
  page?: number
  limit?: number
}) {
  const { published = true, tag, search, page = 1, limit = 10 } = options || {}

  const where = {
    ...(published ? { published: true } : {}),
    ...(tag ? { tags: { contains: tag } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { content: { contains: search } },
          ],
        }
      : {}),
  }

  const [rows, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.post.count({ where }),
  ])

  return {
    posts: rows.map(toBlogPost),
    total,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getLocalPost(slugOrId: string): Promise<BlogPost | null> {
  const slug = slugOrId.replace(/\.md$/, '')
  const p = await db.post.findUnique({ where: { slug } })
  return p ? toBlogPost(p) : null
}

export async function saveLocalPost(
  slug: string,
  data: {
    title: string
    excerpt?: string
    content: string
    tags?: string
    published?: boolean
    authorName?: string
  },
): Promise<BlogPost> {
  const payload = {
    title: data.title,
    excerpt: data.excerpt || null,
    content: data.content,
    tags: data.tags || '',
    published: data.published !== false,
    authorName: data.authorName || 'Anonymous',
  }

  const post = await db.post.upsert({
    where: { slug },
    create: { ...payload, slug },
    update: payload,
  })

  return toBlogPost(post)
}

export async function deleteLocalPost(slug: string): Promise<boolean> {
  const result = await db.post.deleteMany({ where: { slug } })
  return result.count > 0
}

export async function getAllTags(): Promise<string[]> {
  const { posts } = await listLocalPosts({ published: true, limit: 999 })
  const tagSet = new Set<string>()
  posts.forEach((p) => {
    p.tags?.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => tagSet.add(t))
  })
  return Array.from(tagSet).sort()
}
