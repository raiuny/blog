'use client'

import { Github, Heart, Rss } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Built with</span>
          <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
          <span>using Next.js & Tailwind CSS</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/api/posts/rss"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="RSS Feed"
          >
            <Rss className="h-4 w-4" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  )
}