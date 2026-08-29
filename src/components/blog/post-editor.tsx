'use client'

import { useState, useEffect, useRef } from 'react'
import { useBlogStore, type BlogPost } from '@/stores/blog-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function PostEditor() {
  const { isEditorOpen, closeEditor, editingPost, addPostToList, updatePostInList } = useBlogStore()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [published, setPublished] = useState(true)
  const [authorName, setAuthorName] = useState('Anonymous')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditorOpen) {
      if (editingPost) {
        setTitle(editingPost.title)
        setSlug(editingPost.slug)
        setExcerpt(editingPost.excerpt || '')
        setContent(editingPost.content)
        setTags(editingPost.tags)
        setPublished(editingPost.published)
        setAuthorName(editingPost.authorName)
      } else {
        setTitle('')
        setSlug('')
        setExcerpt('')
        setContent('')
        setTags('')
        setPublished(true)
        setAuthorName('Anonymous')
      }
      setPreview(false)
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [isEditorOpen, editingPost])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (!editingPost) {
      setSlug(slugify(e.target.value))
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Title and slug are required')
      return
    }

    setSaving(true)
    try {
      const postData = {
        title,
        slug,
        excerpt,
        content,
        tags,
        published,
        authorName,
      }

      const body = { ...postData }
      let res
      if (editingPost) {
        res = await fetch(`/api/posts/${editingPost.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save post')
        return
      }
      if (editingPost) {
        updatePostInList(data.post)
      } else {
        addPostToList(data.post)
      }
      if (data.githubSync === 'ok') {
        toast.success(editingPost ? 'Post updated & synced to GitHub' : 'Post published & synced to GitHub')
      } else {
        toast.warning(`Saved, but GitHub sync failed: ${data.githubSyncError || 'unknown error'}`)
      }
      closeEditor()
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape' && !e.shiftKey) {
      closeEditor()
    }
  }

  return (
    <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) closeEditor() }}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:h-[85vh]">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {editingPost ? 'Edit Post' : 'New Post'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={preview ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5 rounded-full text-xs"
              onClick={() => setPreview(!preview)}
            >
              <Eye className="h-3 w-3" />
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {editingPost ? 'Update' : 'Publish'}
            </Button>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden" onKeyDown={handleKeyDown}>
          {preview ? (
            <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
              <h1 className="mb-2 text-2xl font-bold">{title || 'Untitled'}</h1>
              {excerpt && <p className="mb-6 text-muted-foreground">{excerpt}</p>}
              <div className="prose-blog">
                <ReactMarkdown>{content || '*Start writing...*'}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-6">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">Title</Label>
                <Input
                  ref={titleRef}
                  id="title"
                  placeholder="Your post title..."
                  value={title}
                  onChange={handleTitleChange}
                  className="border-0 bg-secondary/50 text-xl font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-1"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-xs font-medium text-muted-foreground">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="border-0 bg-secondary/50 text-sm focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author" className="text-xs font-medium text-muted-foreground">Author</Label>
                  <Input
                    id="author"
                    placeholder="Author name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="border-0 bg-secondary/50 text-sm focus-visible:ring-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerpt" className="text-xs font-medium text-muted-foreground">Excerpt</Label>
                <Input
                  id="excerpt"
                  placeholder="A brief description of your post..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="border-0 bg-secondary/50 text-sm focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content" className="text-xs font-medium text-muted-foreground">Content (Markdown)</Label>
                  <span className="text-[10px] text-muted-foreground/60">Ctrl+Enter to save</span>
                </div>
                <Textarea
                  id="content"
                  ref={contentRef}
                  placeholder="# Hello World

Write your content in **Markdown**...

```typescript
console.log('Hello')
```"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="custom-scrollbar min-h-[300px] resize-none border-0 bg-secondary/50 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-xs font-medium text-muted-foreground">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="Next.js, React, Tutorial"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="border-0 bg-secondary/50 text-sm focus-visible:ring-1"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Publish</p>
                  <p className="text-xs text-muted-foreground">
                    {published ? 'This post will be visible to everyone' : 'This post will be saved as a draft'}
                  </p>
                </div>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
