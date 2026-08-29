import { NextResponse } from 'next/server'
import { OWNER_LOGIN, createSessionCookie } from '@/lib/auth'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  if (!code) return NextResponse.redirect(`${origin}/?auth=missing_code`)

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?auth=not_configured`)
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
  const token = tokenData.access_token
  if (!token) return NextResponse.redirect(`${origin}/?auth=token_error`)

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
  })
  const user = (await userRes.json()) as { login?: string; name?: string | null; avatar_url?: string | null }
  if (!user.login) return NextResponse.redirect(`${origin}/?auth=user_error`)

  // Single-owner blog: everyone else stays read-only.
  if (user.login !== OWNER_LOGIN) return NextResponse.redirect(`${origin}/?auth=forbidden`)

  const res = NextResponse.redirect(origin)
  res.headers.append(
    'Set-Cookie',
    createSessionCookie(user.login, user.name ?? null, user.avatar_url ?? null, token),
  )
  return res
}
