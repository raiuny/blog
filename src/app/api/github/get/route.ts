import { NextRequest, NextResponse } from 'next/server'
import { getGitHubPost } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, token, branch, slug } = await req.json()

    if (!owner || !repo || !token || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const post = await getGitHubPost({ owner, repo, token, branch: branch || 'main' }, slug)
    if (!post) {
      return NextResponse.json({ error: 'Post not found on GitHub' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('GitHub get error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to get post from GitHub'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
