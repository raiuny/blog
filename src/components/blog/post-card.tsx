'use client'

import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useBlogStore, type BlogPost } from '@/stores/blog-store'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

interface PostCardProps {
  post: BlogPost
  index: number
}

export function PostCard({ post, index }: PostCardProps) {
  const { selectPost } = useBlogStore()
  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className="group relative"
    >
      <button
        onClick={() => selectPost(post)}
        className="w-full text-left"
      >
        <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full bg-primary/8 text-primary/80 text-[11px] font-medium px-2.5 py-0 hover:bg-primary/15"
                >
                  <Tag className="mr-1 h-2.5 w-2.5" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="mb-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-xl">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {post.authorName.charAt(0)}
                </div>
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                <Clock className="h-3 w-3" />
                <span>{post.readTime} min</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </div>
      </button>
    </motion.article>
  )
}