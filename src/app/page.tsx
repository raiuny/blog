'use client'

import { Header } from '@/components/blog/header'
import { Footer } from '@/components/blog/footer'
import { Hero } from '@/components/blog/hero'
import { PostList } from '@/components/blog/post-list'
import { PostDetail } from '@/components/blog/post-detail'
import { PostEditor } from '@/components/blog/post-editor'
import { useBlogStore } from '@/stores/blog-store'

export default function Home() {
  const { view } = useBlogStore()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {view === 'editor' ? (
          <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6">
            <PostEditor />
          </div>
        ) : view === 'post' ? (
          <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6">
            <PostDetail />
          </div>
        ) : (
          <>
            <Hero />
            <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
              <PostList />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
