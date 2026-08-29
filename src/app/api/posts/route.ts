import { listLocalPosts, saveLocalPost } from '@/lib/posts'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const published = searchParams.get('published') !== 'false'
    const tag = searchParams.get('tag') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const { posts, total, totalPages } = listLocalPosts({ published, tag, search, page, limit })

    return NextResponse.json({ posts, pagination: { page, limit, total, totalPages } })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, slug, excerpt, content, tags, published, authorName } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    const post = listLocalPosts({ published: false, limit: 999 }).posts.find(
      (p) => p.slug === slug,
    )
    if (post) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 })
    }

    const newPost = saveLocalPost(slug, { title, excerpt, content, tags, published, authorName })
    return NextResponse.json({ post: newPost }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
