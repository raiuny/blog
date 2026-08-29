import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/', req.url).origin)
  res.headers.append('Set-Cookie', clearSessionCookie())
  return res
}
