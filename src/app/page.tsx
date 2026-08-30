'use client'

import { Header } from '@/components/blog/header'
import { useBlogStore } from '@/stores/blog-store'
import { Footer } from '@/components/blog/footer'
import { Hero } from '@/components/blog/hero'
import { PostList } from '@/components/blog/post-list'
import { PostDetail } from '@/components/blog/post-detail'
import { PostEditor } from '@/components/blog/post-editor'
import { ImagePanel } from '@/components/blog/image-panel'

export default function Home() {
  const { view } = useBlogStore()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {view === 'editor' ? (
          <div className="mx-auto flex w-full flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:w-[61.8vw] lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <PostEditor />
            </div>
            <ImagePanel />
          </div>
        ) : view === 'post' ? (
          <div className="mx-auto w-full px-4 pb-16 pt-6 sm:px-6 lg:w-[61.8vw]">
            <PostDetail />
          </div>
        ) : (
          <>
            <Hero />
            <div className="mx-auto w-full px-4 pb-16 sm:px-6 lg:w-[61.8vw]">
              <PostList />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
