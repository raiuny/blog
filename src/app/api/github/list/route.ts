import { NextRequest, NextResponse } from 'next/server'
import { listGitHubPosts } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, token, branch } = await req.json()

    if (!owner || !repo || !token) {
      return NextResponse.json({ error: 'GitHub config is required' }, { status: 400 })
    }

    const posts = await listGitHubPosts({ owner, repo, token, branch: branch || 'main' })
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('GitHub list error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to list posts from GitHub'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
