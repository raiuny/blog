import { NextRequest, NextResponse } from 'next/server'
import { OWNER_LOGIN, createSessionCookie, verifyCredentials } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
  if (!verifyCredentials(body.email, body.password)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }
  const res = NextResponse.json({ authenticated: true, login: OWNER_LOGIN })
  res.headers.append('Set-Cookie', createSessionCookie(OWNER_LOGIN))
  return res
}
