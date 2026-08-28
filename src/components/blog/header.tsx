'use client'

import { Github, PenSquare, Search, ArrowLeft, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBlogStore } from '@/stores/blog-store'
import { useState, useEffect, useRef } from 'react'

export function Header() {
  const { view, setView, openEditor, searchQuery, setSearch, selectedPost } = useBlogStore()
  const [showSearch, setShowSearch] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus()
    }
  }, [showSearch])

  const handleBack = () => {
    setView('home')
    useBlogStore.getState().selectPost(null)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          {view === 'post' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to posts</span>
            </Button>
          )}
          <button
            onClick={handleBack}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">B</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {selectedPost ? selectedPost.title.slice(0, 24) + (selectedPost.title.length > 24 ? '...' : '') : 'Blog' }
            </span>
          </button>
        </div>

        {/* Right - Desktop */}
        <div className="hidden items-center gap-2 sm:flex">
          {showSearch ? (
            <div className="flex items-center gap-2">
              <Input
                ref={searchRef}
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 bg-secondary/50 border-0 focus-visible:ring-1"
                onBlur={() => {
                  if (!searchQuery) setShowSearch(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearch('')
                    setShowSearch(false)
                  }
                }}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditor()}
            className="h-9 gap-1.5 rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <PenSquare className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Write</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
            asChild
          >
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
        </div>

        {/* Right - Mobile */}
        <div className="flex items-center gap-1 sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditor()}
            className="h-9 w-9 rounded-full"
          >
            <PenSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 rounded-full"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/60 bg-background px-4 pb-4 pt-3 sm:hidden">
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 h-9 bg-secondary/50 border-0"
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 rounded-lg text-muted-foreground"
            asChild
          >
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      )}
    </header>
  )
}