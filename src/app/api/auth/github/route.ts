import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID is not configured' }, { status: 500 })
  }

  const origin = new URL(req.url).origin
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/github/callback`,
    scope: 'read:user repo',
    state: crypto.randomUUID(),
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
