import { getLocalPost, saveLocalPost, deleteLocalPost } from '@/lib/posts'
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

    return NextResponse.json({ post })
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
    const ok = await deleteLocalPost(id)
    if (!ok) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
