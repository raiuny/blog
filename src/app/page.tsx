'use client'

import { useEffect } from 'react'
import { Header } from '@/components/blog/header'
import { Footer } from '@/components/blog/footer'
import { Hero } from '@/components/blog/hero'
import { PostList } from '@/components/blog/post-list'
import { PostDetail } from '@/components/blog/post-detail'
import { PostEditor } from '@/components/blog/post-editor'
import { useBlogStore } from '@/stores/blog-store'

export default function Home() {
  const { view } = useBlogStore()

  // Seed database on first load
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {view === 'home' ? (
          <>
            <Hero />
            <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
              <PostList />
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
            <PostDetail />
          </div>
        )}
      </main>

      <Footer />
      <PostEditor />
    </div>
  )
}
