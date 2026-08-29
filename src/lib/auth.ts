import crypto from 'crypto'
import { cookies } from 'next/headers'

export const OWNER_LOGIN = process.env.OWNER_GITHUB_LOGIN || 'raiuny'
const COOKIE_NAME = 'blog_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface OwnerSession {
  login: string
  name: string | null
  avatar: string | null
  token: string
  exp: number
}

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET is not set')
  return s
}
// Signing must stay in lockstep between cookie creation (below) and
// verification (decode) — change both together.
function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}


function decode(value: string | undefined): OwnerSession | null {
  if (!value) return null
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as OwnerSession
    if (!session.exp || session.exp < Date.now()) return null
    return session
  } catch {
    return null
  }
}

/** Read the owner session from request cookies. Returns null for visitors. */
export async function getSession(): Promise<OwnerSession | null> {
  const store = await cookies()
  const session = decode(store.get(COOKIE_NAME)?.value)
  return session && session.login === OWNER_LOGIN ? session : null
}

export function createSessionCookie(login: string, name: string | null, avatar: string | null, token: string): string {
  const session: OwnerSession = {
    login,
    name,
    avatar,
    token,
    exp: Date.now() + MAX_AGE * 1000,
  }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${COOKIE_NAME}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}
