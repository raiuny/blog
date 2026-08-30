import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|svg)$/i
export const dynamic = 'force-dynamic'

function pickMessage(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
    return value.message
  }
  return undefined
}

function isImageEntry(value: unknown): value is { name: string; path: string; download_url?: string; size: number } {
  return (
    typeof value === 'object' && value !== null &&
    'name' in value && typeof value.name === 'string' && IMAGE_RE.test(value.name) &&
    'path' in value && typeof value.path === 'string'
  )
}

function githubHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
}

/** List images stored in the repo's images/ folder. */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN is not configured' }, { status: 500 })
  }

  const owner = process.env.OWNER_GITHUB_LOGIN || 'raiuny'
  const repo = process.env.GITHUB_REPO || 'raiuny.github.io'

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/images`, {
    cache: 'no-store',
    headers: githubHeaders(token),
  })
  if (res.status === 404) {
    return NextResponse.json({ images: [] }) // folder not created yet
  }
  if (!res.ok) {
    const err: unknown = await res.json().catch(() => null)
    return NextResponse.json({ error: pickMessage(err) || 'Failed to list images' }, { status: 500 })
  }

  const files: unknown = await res.json()
  const images = Array.isArray(files)
    ? files.filter(isImageEntry).map((f) => ({ name: f.name, path: f.path, url: f.download_url ?? '', size: f.size }))
    : []
  return NextResponse.json({ images })
}

/** Delete an image by its repo path (must live under images/). */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN is not configured' }, { status: 500 })
  }

  const body = (await req.json().catch(() => null)) as unknown
  const path =
    body && typeof body === 'object' && 'path' in body && typeof body.path === 'string'
      ? body.path
      : undefined
  if (!path || !path.startsWith('images/') || path.includes('..')) {
    return NextResponse.json({ error: 'Invalid image path' }, { status: 400 })
  }

  const owner = process.env.OWNER_GITHUB_LOGIN || 'raiuny'
  const repo = process.env.GITHUB_REPO || 'raiuny.github.io'
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  const metaRes = await fetch(api, { headers: githubHeaders(token) })
  if (metaRes.status === 404) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
  const meta: unknown = await metaRes.json().catch(() => null)
  let sha: string | undefined
  if (meta && typeof meta === 'object' && 'sha' in meta && typeof meta.sha === 'string') {
    sha = meta.sha
  }
  if (!sha) {
    return NextResponse.json({ error: 'Failed to resolve image sha' }, { status: 500 })
  }

  const delRes = await fetch(api, {
    method: 'DELETE',
    headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Delete image: ${path.split('/').pop()}`, sha, branch: 'main' }),
  })
  if (!delRes.ok) {
    const err: unknown = await delRes.json().catch(() => null)
    return NextResponse.json({ error: pickMessage(err) || 'Failed to delete image' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
