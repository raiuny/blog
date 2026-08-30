'use client'

import { useState, useEffect, useRef } from 'react'
import { useBlogStore, type BlogPost } from '@/stores/blog-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Eye, ArrowLeft, Link2, ImagePlus } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BASE_PATH } from '@/lib/client-config'
import { Markdown, normalizeLink } from '@/components/blog/markdown'

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
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingImage, setPendingImage] = useState<{ url: string; name: string } | null>(null)
  const [imageWidth, setImageWidth] = useState(60)
  const [published, setPublished] = useState(true)
  const [authorName, setAuthorName] = useState('raiuny')
  const [tags, setTags] = useState('')
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        setAuthorName('raiuny')
      }
      setPreview(false)
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [isEditorOpen, editingPost])
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape' && !e.shiftKey) {
      closeEditor()
    }
  }

  /** Replace the textarea selection (or insert at cursor) with snippet. */
  const insertMarkdown = (snippet: string) => {
    const ta = contentRef.current
    const start = ta?.selectionStart ?? content.length
    const end = ta?.selectionEnd ?? content.length
    const next = content.slice(0, start) + snippet + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      const el = contentRef.current
      if (!el) return
      el.focus()
      el.selectionStart = el.selectionEnd = start + snippet.length
    })
  }

  const insertLink = () => {
    const url = window.prompt('Link URL:')
    if (!url) return
    const ta = contentRef.current
    const start = ta?.selectionStart ?? content.length
    const end = ta?.selectionEnd ?? content.length
    const label = content.slice(start, end) || 'link text'
    insertMarkdown(`[${label}](${normalizeLink(url.trim())})`)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BASE_PATH}/api/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }
      // Open the size-preview dialog for the freshly uploaded image
      setPendingImage({ url: data.url, name: file.name })
      setImageWidth(60)
      window.dispatchEvent(new CustomEvent('blog:images-updated'))
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const confirmInsertImage = () => {
    if (!pendingImage) return
    insertMarkdown(`\n<img src="${pendingImage.url}" width="${imageWidth}%" alt="${pendingImage.name.replace(/"/g, '')}">\n`)
    setPendingImage(null)
  }
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
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div onKeyDown={handleKeyDown} className="flex flex-col">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={closeEditor}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {editingPost ? 'Edit Post' : 'New Post'}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={preview ? 'default' : 'outline'}
            size="sm"
            className="h-9 gap-1.5 rounded-full text-xs"
            onClick={() => setPreview(!preview)}
          >
            <Eye className="h-3.5 w-3.5" />
            {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {editingPost ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="custom-scrollbar overflow-y-auto">
          <h1 className="mb-2 text-2xl font-bold tracking-tight">{title || 'Untitled'}</h1>
          {excerpt && <p className="mb-6 text-muted-foreground">{excerpt}</p>}
          <div className="prose-blog prose-editor-preview">
            <Markdown>{content || '*Start writing...*'}</Markdown>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">Title</Label>
            <Input
              ref={titleRef}
              id="title"
              placeholder="Your post title..."
              value={title}
              onChange={handleTitleChange}
              className="h-14 border-0 bg-secondary/50 text-2xl font-bold tracking-tight placeholder:font-normal placeholder:text-muted-foreground/50 focus-visible:ring-1"
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
              <div className="flex items-center gap-2">
                <Label htmlFor="content" className="text-xs font-medium text-muted-foreground">Content (Markdown)</Label>
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Insert link"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                    onClick={insertLink}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Insert image"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/svg+xml"
            className="hidden"
            onChange={handleImageUpload}
          />
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
              className="custom-scrollbar min-h-[55vh] resize-none border-0 bg-secondary/50 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-1"
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
      <Dialog open={isEditorOpen && pendingImage !== null} onOpenChange={(open) => { if (!open) setPendingImage(null) }}>
        {/* Width matches the post content column so the preview is WYSIWYG */}
        <DialogContent className="max-w-none p-4 sm:w-[61.8vw] sm:max-w-none sm:p-6">
          <DialogHeader>
            <DialogTitle>调整图片大小</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-border/50 bg-secondary/30">
            {pendingImage && (
              <img
                src={pendingImage.url}
                alt={pendingImage.name}
                style={{ width: `${imageWidth}%` }}
                className="mx-auto rounded-lg"
              />
            )}
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">宽度（相对文章内容列）</span>
              <span className="font-medium">{imageWidth}%</span>
            </div>
            <Slider
              value={[imageWidth]}
              min={5}
              max={100}
              step={1}
              onValueChange={(v) => setImageWidth(v[0] as number)}
            />
            <p className="text-xs text-muted-foreground/70">
              预览尺寸与发布后在文章列中的实际尺寸一致。
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setPendingImage(null)}>
              取消
            </Button>
            <Button size="sm" onClick={confirmInsertImage}>
              插入
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
