import { NextRequest, NextResponse } from 'next/server'
import { triggerRebuild } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, token, branch } = await req.json()

    if (!owner || !repo || !token) {
      return NextResponse.json({ error: 'GitHub config is required' }, { status: 400 })
    }

    await triggerRebuild({ owner, repo, token, branch: branch || 'main' })
    return NextResponse.json({ success: true, message: 'Rebuild triggered' })
  } catch (error) {
    console.error('GitHub rebuild error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to trigger rebuild'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
