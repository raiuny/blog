import { getLocalPost, saveLocalPost, deleteLocalPost } from '@/lib/posts'
import { getSession } from '@/lib/auth'
import { syncPostToRepo, removePostFromRepo } from '@/lib/sync'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await getLocalPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const existing = await getLocalPost(id)
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const newSlug = body.slug || existing.slug

    // Slug changed: remove the old row so no orphan post is left behind
    if (newSlug !== existing.slug) {
      await deleteLocalPost(existing.slug)
    }

    const post = await saveLocalPost(newSlug, {
      title: body.title ?? existing.title,
      excerpt: body.excerpt ?? existing.excerpt,
      content: body.content ?? existing.content,
      tags: body.tags ?? existing.tags,
      published: body.published ?? existing.published,
      authorName: body.authorName ?? existing.authorName,
    })

    let githubSync: 'ok' | 'failed' = 'ok'
    let githubSyncError: string | undefined
    try {
      // Slug changed: drop the old markdown file before writing the new one
      if (newSlug !== existing.slug) {
        await removePostFromRepo(existing.slug)
      }
      await syncPostToRepo(post)
    } catch (err) {
      githubSync = 'failed'
      githubSyncError = err instanceof Error ? err.message : 'GitHub sync failed'
      console.error('GitHub sync failed for updated post:', err)
    }

    return NextResponse.json({ post, githubSync, githubSyncError })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ok = await deleteLocalPost(id)
    if (!ok) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    let githubSync: 'ok' | 'failed' = 'ok'
    let githubSyncError: string | undefined
    try {
      await removePostFromRepo(id)
    } catch (err) {
      githubSync = 'failed'
      githubSyncError = err instanceof Error ? err.message : 'GitHub sync failed'
      console.error('GitHub sync failed for deleted post:', err)
    }

    return NextResponse.json({ success: true, githubSync, githubSyncError })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
