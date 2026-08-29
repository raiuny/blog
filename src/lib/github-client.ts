/**
 * Client-side GitHub API helpers.
 * These call GitHub API directly from the browser (CORS supported).
 */

import type { GitHubConfig, BlogPost } from './github'

const GH_API = 'https://api.github.com'

async function ghFetch(config: GitHubConfig, path: string, init?: RequestInit) {
  const url = `${GH_API}/repos/${config.owner}/${config.repo}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub API error: ${res.status}`)
  }
  return res
}

/** List all .md files from GitHub repo's posts/ directory */
export async function clientListPosts(config: GitHubConfig): Promise<BlogPost[]> {
  const res = await ghFetch(config, `/contents/posts?ref=${config.branch}`)
  const files = await res.json()
  const mdFiles = Array.isArray(files) ? files.filter((f: { name: string }) => f.name.endsWith('.md')) : []

  const posts: BlogPost[] = []
  for (const file of mdFiles) {
    const fileRes = await ghFetch(config, `/contents/posts/${file.name}?ref=${config.branch}`)
    const fileData = await fileRes.json()
    if (fileData.content) {
      const raw = atob(fileData.content)
      posts.push({
        id: fileData.sha,
        slug: parseFrontmatter(raw).data.slug || file.name.replace('.md', ''),
        ...parseFrontmatter(raw),
        sha: fileData.sha,
      })
    }
  }

  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Save (create or update) a post on GitHub */
export async function clientSavePost(
  config: GitHubConfig,
  post: { title: string; slug: string; excerpt?: string; content: string; tags?: string; published: boolean; authorName: string },
  sha?: string,
): Promise<BlogPost> {
  const frontmatter = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || null,
    tags: post.tags || null,
    author: post.authorName,
    published: post.published,
    date: new Date().toISOString().split('T')[0],
  }

  // Build raw markdown with frontmatter manually to avoid gray-matter on client
  const fmStr = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === 'string' && v.includes(',') ? JSON.stringify(v) : v}`)
    .join('\n')
  const fullContent = `---\n${fmStr}\n---\n\n${post.content}`
  const encoded = btoa(unescape(encodeURIComponent(fullContent)))
  const path = `posts/${post.slug}.md`

  const body: Record<string, string> = {
    message: sha ? `Update post: ${post.title}` : `Create post: ${post.title}`,
    content: encoded,
    branch: config.branch,
  }
  if (sha) body.sha = sha

  const res = await ghFetch(config, `/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const data = await res.json()

  return {
    id: data.content?.sha || post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.content,
    tags: post.tags || '',
    published: post.published,
    authorName: post.authorName,
    authorAvatar: null,
    githubUrl: null,
    readTime: Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sha: data.content?.sha,
  }
}

/** Delete a post from GitHub */
export async function clientDeletePost(config: GitHubConfig, slug: string, sha: string): Promise<void> {
  const path = `posts/${slug}.md`
  await ghFetch(config, `/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `Delete post: ${slug}`,
      sha,
      branch: config.branch,
    }),
  })
}

// Simple frontmatter parser for client use
function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {} as Record<string, string>, content: raw }

  const fm: Record<string, string> = {}
  match[1].split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length) {
      const val = rest.join(':').trim()
      // Try to parse JSON strings (for values with commas)
      try { fm[key.trim()] = JSON.parse(val) } catch { fm[key.trim()] = val }
    }
  })

  return { data: fm, content: match[2] || '' }
}

// Re-export BlogPost type
export type { BlogPost }