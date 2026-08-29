import { getLocalPost, listLocalPosts, saveLocalPost } from '@/lib/posts'
import { getSession } from '@/lib/auth'
import { syncPostToRepo } from '@/lib/sync'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const published = searchParams.get('published') !== 'false'
    const tag = searchParams.get('tag') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const { posts, total, totalPages } = await listLocalPosts({ published, tag, search, page, limit })

    return NextResponse.json({ posts, pagination: { page, limit, total, totalPages } })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, excerpt, content, tags, published, authorName } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    const existing = await getLocalPost(slug)
    if (existing) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 })
    }

    const newPost = await saveLocalPost(slug, { title, excerpt, content, tags, published, authorName })

    let githubSync: 'ok' | 'failed' = 'ok'
    let githubSyncError: string | undefined
    try {
      await syncPostToRepo(session.token, newPost)
    } catch (err) {
      githubSync = 'failed'
      githubSyncError = err instanceof Error ? err.message : 'GitHub sync failed'
      console.error('GitHub sync failed for new post:', err)
    }

    return NextResponse.json({ post: newPost, githubSync, githubSyncError }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
