'use client'

import { useState } from 'react'
import { useBlogStore } from '@/stores/blog-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Github, Unplug, Loader2, ExternalLink } from 'lucide-react'
import { clientListPosts } from '@/lib/github-client'
import type { GitHubConfig } from '@/lib/github'

export function GithubSettings() {
  const { githubConfig, githubSynced, setGithubConfig } = useBlogStore()
  const [open, setOpen] = useState(false)
  const [owner, setOwner] = useState(githubConfig?.owner || '')
  const [repo, setRepo] = useState(githubConfig?.repo || '')
  const [token, setToken] = useState(githubConfig?.token || '')
  const [branch, setBranch] = useState(githubConfig?.branch || 'main')
  const [testing, setTesting] = useState(false)

  const handleOpen = () => {
    if (githubConfig) {
      setOwner(githubConfig.owner)
      setRepo(githubConfig.repo)
      setToken(githubConfig.token)
      setBranch(githubConfig.branch || 'main')
    }
    setOpen(true)
  }

  const handleTest = async () => {
    if (!owner || !repo || !token) {
      toast.error('Please fill in all fields')
      return
    }
    setTesting(true)
    try {
      const posts = await clientListPosts({ owner, repo, token, branch: branch || 'main' })
      toast.success(`Connected! Found ${posts.length} post(s) on GitHub`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!owner || !repo || !token) {
      toast.error('Please fill in all fields')
      return
    }
    setGithubConfig({ owner, repo, token, branch: branch || 'main' })
    setOpen(false)
    toast.success('GitHub sync enabled')
  }

  const handleDisconnect = () => {
    setGithubConfig(null)
    setOwner('')
    setRepo('')
    setToken('')
    setBranch('main')
    setOpen(false)
    toast.success('Disconnected from GitHub')
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className={`h-9 w-9 rounded-full ${
          githubSynced
            ? 'text-primary hover:bg-primary/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        }`}
      >
        <Github className="h-4 w-4" />
        <span className="sr-only">GitHub Settings</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Sync Settings
            </DialogTitle>
            <DialogDescription>
              Connect your GitHub repository to read and write blog posts online.
              Posts are stored as Markdown files in the <code className="rounded bg-secondary px-1 py-0.5 text-xs">posts/</code> directory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="gh-owner" className="text-xs">Repository Owner</Label>
              <Input
                id="gh-owner"
                placeholder="your-username"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gh-repo" className="text-xs">Repository Name</Label>
              <Input
                id="gh-repo"
                placeholder="my-blog"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gh-token" className="text-xs">
                Personal Access Token
              </Label>
              <Input
                id="gh-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Needs <code className="rounded bg-secondary px-0.5">repo</code> permission.{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Blog%20CMS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  Create one <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gh-branch" className="text-xs">Branch</Label>
              <Input
                id="gh-branch"
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {githubSynced ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!owner || !repo || !token || testing}
              >
                {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Test
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!owner || !repo || !token} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
