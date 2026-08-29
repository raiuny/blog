import { NextRequest, NextResponse } from 'next/server'
import { saveGitHubPost } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, token, branch, post, sha } = await req.json()

    if (!owner || !repo || !token) {
      return NextResponse.json({ error: 'GitHub config is required' }, { status: 400 })
    }

    const result = await saveGitHubPost(
      { owner, repo, token, branch: branch || 'main' },
      post,
      sha,
    )

    return NextResponse.json({ post: result })
  } catch (error) {
    console.error('GitHub push error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to push to GitHub'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
