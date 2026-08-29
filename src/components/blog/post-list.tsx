'use client'

import { useEffect, useCallback } from 'react'
import { PostCard } from './post-card'
import { useBlogStore } from '@/stores/blog-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tag, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { BASE_PATH, STATIC_MODE } from '@/lib/client-config'

const PAGE_SIZE = 10

type PostData = {
  id: string
  slug: string
  title: string
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

export function PostList() {
  const {
    posts,
    totalPosts,
    currentPage,
    totalPages,
    isLoading,
    searchQuery,
    activeTag,
    allTags,
    setPosts,
    setPage,
    setLoading,
    setAllTags,
  } = useBlogStore()

  const extractTags = (list: PostData[]) => {
    const tagSet = new Set<string>()
    list.forEach((p) => {
      p.tags?.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => tagSet.add(t))
    })
    return Array.from(tagSet).sort()
  }

  const filterAndPaginate = useCallback(
    (all: PostData[]) => {
      let filtered = all.filter((p) => p.published)
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.excerpt?.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q),
        )
      }
      if (activeTag) {
        filtered = filtered.filter((p) => p.tags?.includes(activeTag))
      }
      const total = filtered.length
      const totalPagesLocal = Math.ceil(total / PAGE_SIZE)
      const start = (currentPage - 1) * PAGE_SIZE
      setPosts(filtered.slice(start, start + PAGE_SIZE), total, totalPagesLocal)
      setAllTags(extractTags(all))
    },
    [searchQuery, activeTag, currentPage, setPosts, setAllTags],
  )

  const fetchStatic = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_PATH}/posts.json`)
      const data = await res.json()
      filterAndPaginate(data.posts ?? [])
    } catch (err) {
      console.error('Failed to fetch static posts:', err)
    } finally {
      setLoading(false)
    }
  }, [filterAndPaginate, setLoading])

  const fetchLocal = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        published: 'true',
      })
      if (searchQuery) params.set('search', searchQuery)
      if (activeTag) params.set('tag', activeTag)

      const res = await fetch(`${BASE_PATH}/api/posts?${params}`)
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts, data.pagination.total, data.pagination.totalPages)
        setAllTags(extractTags(data.posts))
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, activeTag, setPosts, setLoading, setAllTags])

  useEffect(() => {
    if (STATIC_MODE) {
      fetchStatic()
    } else {
      fetchLocal()
    }
  }, [STATIC_MODE, fetchStatic, fetchLocal])

  return (
    <div className="space-y-6">
      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeTag === null ? 'default' : 'outline'}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all ${
              activeTag === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary'
            }`}
            onClick={() => useBlogStore.getState().setTag(null)}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? 'default' : 'outline'}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeTag === tag
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary'
              }`}
              onClick={() => useBlogStore.getState().setTag(tag)}
            >
              <Tag className="mr-1 h-2.5 w-2.5" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Posts count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span>
          {searchQuery ? `Search results for "${searchQuery}"` : `${totalPosts} article${totalPosts !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Post Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card p-6">
              <Skeleton className="mb-3 h-5 w-20 rounded-full" />
              <Skeleton className="mb-2 h-6 w-3/4" />
              <Skeleton className="mb-4 h-4 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-foreground">No posts found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Start writing your first blog post'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-full text-xs ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
