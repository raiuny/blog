import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSession } from '@/lib/auth'

const MAX_SIZE = 4 * 1024 * 1024 // Vercel request body limit is 4.5MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']

function pickMessage(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
    return value.message
  }
  return undefined
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN is not configured' }, { status: 500 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image exceeds 4MB limit' }, { status: 400 })
  }

  const owner = process.env.OWNER_GITHUB_LOGIN || 'raiuny'
  const repo = process.env.GITHUB_REPO || 'raiuny.github.io'

  const ext = file.name.includes('.') ? file.name.split('.').pop() : file.type.split('/')[1]
  const safeExt = (ext || 'png').replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'png'
  const base = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image'
  const path = `images/${base}-${crypto.randomBytes(3).toString('hex')}.${safeExt}`

  const content = Buffer.from(await file.arrayBuffer()).toString('base64')
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Upload image: ${path.split('/').pop()}`,
      content,
      branch: 'main',
    }),
  })

  if (!res.ok) {
    const err: unknown = await res.json().catch(() => null)
    console.error('Image upload failed:', err)
    return NextResponse.json({ error: pickMessage(err) || 'GitHub upload failed' }, { status: 500 })
  }

  const data: unknown = await res.json()
  let url: string | undefined
  if (data && typeof data === 'object' && 'content' in data && data.content && typeof data.content === 'object' && 'download_url' in data.content) {
    const download = data.content.download_url
    if (typeof download === 'string') url = download
  }
  if (!url) {
    return NextResponse.json({ error: 'Upload succeeded but no URL returned' }, { status: 500 })
  }

  return NextResponse.json({ url, path })
}
