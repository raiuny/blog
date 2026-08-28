import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await db.post.findUnique({ where: { id } })
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
    
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
    if (body.content !== undefined) updateData.content = body.content
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.published !== undefined) updateData.published = body.published
    if (body.authorName !== undefined) updateData.authorName = body.authorName
    if (body.authorAvatar !== undefined) updateData.authorAvatar = body.authorAvatar
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl
    
    if (body.content !== undefined) {
      const wordCount = body.content.split(/\s+/).length
      updateData.readTime = Math.max(1, Math.ceil(wordCount / 200))
    }
    
    const post = await db.post.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({ post })
  } catch (error: unknown) {
    console.error('Error updating post:', error)
    const msg = error instanceof Error && error.message.includes('Unique')
      ? 'A post with this slug already exists'
      : 'Failed to update post'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
