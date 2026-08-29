import { NextRequest, NextResponse } from 'next/server'
import { deleteGitHubPost } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, token, branch, slug, sha } = await req.json()

    if (!owner || !repo || !token || !slug || !sha) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await deleteGitHubPost({ owner, repo, token, branch: branch || 'main' }, slug, sha)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GitHub delete error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to delete from GitHub'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
