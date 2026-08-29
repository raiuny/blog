import matter from 'gray-matter'

export interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  content?: string
}

export interface PostFrontmatter {
  title: string
  slug: string
  excerpt?: string
  tags?: string
  author?: string
  published?: boolean
  date?: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string
  published: boolean
  authorName: string
  authorAvatar: string | null
  githubUrl: string | null
  readTime: number
  createdAt: string
  updatedAt: string
  sha?: string
}

function calcReadTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function parsePostFromMatter(content: string, sha?: string): BlogPost {
  const { data, content: body } = matter(content)
  const fm = data as PostFrontmatter
  return {
    id: sha || fm.slug,
    title: fm.title || 'Untitled',
    slug: fm.slug || 'untitled',
    excerpt: fm.excerpt || '',
    content: body,
    tags: fm.tags || '',
    published: fm.published !== false,
    authorName: fm.author || 'Anonymous',
    authorAvatar: null,
    githubUrl: null,
    readTime: calcReadTime(body),
    createdAt: fm.date || new Date().toISOString(),
    updatedAt: fm.date || new Date().toISOString(),
    sha,
  }
}

function postToMatter(post: Omit<BlogPost, 'id' | 'readTime' | 'authorAvatar' | 'githubUrl'>): string {
  const fm: Record<string, unknown> = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || null,
    tags: post.tags || null,
    author: post.authorName,
    published: post.published,
    date: new Date().toISOString().split('T')[0],
  }
  return matter.stringify(post.content, fm)
}

// ---------- GitHub API helpers ----------

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

// ---------- Public API ----------

/** List all posts from GitHub repo's posts/ directory */
export async function listGitHubPosts(config: GitHubConfig): Promise<BlogPost[]> {
  const res = await ghFetch(config, `/contents/posts?ref=${config.branch}`)
  const files: GitHubFile[] = await res.json()
  const mdFiles = files.filter((f) => f.name.endsWith('.md'))

  const posts: BlogPost[] = []
  for (const file of mdFiles) {
    const fileRes = await ghFetch(config, `/contents/posts/${file.name}?ref=${config.branch}`)
    const fileData: GitHubFile = await fileRes.json()
    if (fileData.content) {
      const raw = Buffer.from(fileData.content, 'base64').toString('utf-8')
      posts.push(parsePostFromMatter(raw, fileData.sha))
    }
  }

  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Get a single post from GitHub */
export async function getGitHubPost(config: GitHubConfig, slug: string): Promise<BlogPost | null> {
  try {
    const res = await ghFetch(config, `/contents/posts/${slug}.md?ref=${config.branch}`)
    const fileData: GitHubFile = await res.json()
    if (fileData.content) {
      const raw = Buffer.from(fileData.content, 'base64').toString('utf-8')
      return parsePostFromMatter(raw, fileData.sha)
    }
  } catch {
    return null
  }
  return null
}

/** Create or update a post on GitHub */
export async function saveGitHubPost(
  config: GitHubConfig,
  post: Omit<BlogPost, 'id' | 'readTime' | 'authorAvatar' | 'githubUrl' | 'createdAt' | 'updatedAt'>,
  sha?: string,
): Promise<BlogPost> {
  const content = postToMatter(post)
  const encoded = Buffer.from(content).toString('base64')
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
  return parsePostFromMatter(content, data.content?.sha)
}

/** Delete a post from GitHub */
export async function deleteGitHubPost(config: GitHubConfig, slug: string, sha: string): Promise<void> {
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

/** Trigger GitHub Actions workflow to rebuild the site */
export async function triggerRebuild(config: GitHubConfig): Promise<void> {
  await ghFetch(config, `/actions/workflows/deploy.yml/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: config.branch }),
  })
}
