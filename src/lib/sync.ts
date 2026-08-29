import { getGitHubPost, saveGitHubPost, deleteGitHubPost } from './github'
import type { BlogPost } from './github'

export interface RepoConfig {
  owner: string
  repo: string
  token: string
  branch: string
}
export function repoConfig(): RepoConfig {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is not configured')
  return {
    owner: process.env.OWNER_GITHUB_LOGIN || 'raiuny',
    repo: process.env.GITHUB_REPO || 'raiuny.github.io',
    token,
    branch: 'main',
  }
}

/** Upsert the markdown file for a post in the GitHub repo. */
export async function syncPostToRepo(post: BlogPost): Promise<void> {
  const config = repoConfig()
  const existing = await getGitHubPost(config, post.slug)
  await saveGitHubPost(
    config,
    {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags,
      published: post.published,
      authorName: post.authorName,
    },
    existing?.sha,
  )
}

/** Delete the markdown file for a slug from the GitHub repo (no-op if absent). */
export async function removePostFromRepo(slug: string): Promise<void> {
  const config = repoConfig()
  const existing = await getGitHubPost(config, slug)
  if (existing?.sha) {
    await deleteGitHubPost(config, slug, existing.sha)
  }
}
