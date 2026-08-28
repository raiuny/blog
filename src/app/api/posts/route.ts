import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const publishedOnly = searchParams.get('published') !== 'false'
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = {}
    if (publishedOnly) where.published = true
    if (tag) where.tags = { contains: tag }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, tags, published, authorName, authorAvatar, githubUrl } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    // Calculate read time (~200 words per minute)
    const wordCount = content ? content.split(/\s+/).length : 0
    const readTime = Math.max(1, Math.ceil(wordCount / 200))

    const post = await db.post.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || '',
        coverImage: coverImage || null,
        tags: tags || '',
        published: published ?? false,
        authorName: authorName || 'Anonymous',
        authorAvatar: authorAvatar || null,
        githubUrl: githubUrl || null,
        readTime,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating post:', error)
    const msg = error instanceof Error && error.message.includes('Unique')
      ? 'A post with this slug already exists'
      : 'Failed to create post'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}