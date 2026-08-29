'use client'

import { useBlogStore } from '@/stores/blog-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowLeft, Trash2, Edit3, Tag } from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useSession } from '@/hooks/use-session'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function PostDetail() {
  const { selectedPost, selectPost, openEditor, removePostFromList, setView } = useBlogStore()
  const session = useSession()

  const handleDelete = async () => {
    if (!selectedPost) return
    try {
      const res = await fetch(`/api/posts/${selectedPost.slug}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete post')
        return
      }
      removePostFromList(selectedPost.slug)
      setView('home')
      selectPost(null)
      toast.success('Post deleted successfully')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  if (!selectedPost) return null

  const tags = selectedPost.tags ? selectedPost.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={selectedPost.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto w-full"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setView('home'); selectPost(null) }}
          className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to posts
        </Button>

        {/* Header */}
        <header className="relative mb-8">
          {/* Owner actions - top right, icon only */}
          {session?.authenticated && (
            <div className="absolute right-0 top-0 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => openEditor(selectedPost)}
              >
                <Edit3 className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The post &quot;{selectedPost.title}&quot; will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full bg-primary/8 text-primary/80 text-[11px] font-medium px-2.5 py-0"
                >
                  <Tag className="mr-1 h-2.5 w-2.5" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="mb-4 text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
            {selectedPost.title}
          </h1>

          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {selectedPost.authorName.charAt(0)}
              </div>
              <span className="font-medium text-foreground/80">{selectedPost.authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(selectedPost.createdAt), 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{selectedPost.readTime} min read</span>
            </div>
          </div>
        </header>

        {/* Divider */}
        <div className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Content */}
        <div className="prose-blog">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match && !className
                if (isInline) {
                  return <code className={className} {...props}>{children}</code>
                }
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match?.[1] || 'text'}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                )
              },
            }}
          >
            {selectedPost.content}
          </ReactMarkdown>
        </div>

        {/* Footer divider */}
        <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Post footer */}
        <div className="flex items-center justify-between py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Published on {format(new Date(selectedPost.createdAt), 'MMMM d, yyyy')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setView('home'); selectPost(null) }}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Button>
        </div>
      </motion.article>
    </AnimatePresence>
  )
}