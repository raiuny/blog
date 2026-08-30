'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { RefreshCw, Trash2 } from 'lucide-react'
import { BASE_PATH } from '@/lib/client-config'

export interface UploadedImage {
  name: string
  path: string
  url: string
  size: number
}

export function ImagePanel() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_PATH}/api/images`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setImages(data.images ?? [])
    } catch {
      // panel is best-effort; silence network hiccups
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const onUpdated = () => load()
    window.addEventListener('blog:images-updated', onUpdated)
    return () => window.removeEventListener('blog:images-updated', onUpdated)
  }, [load])

  const handleDelete = async (path: string, name: string, url: string) => {
    setDeleting(path)
    try {
      const res = await fetch(`${BASE_PATH}/api/images`, {
        cache: 'no-store',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete image')
        return
      }
      setImages((prev) => prev.filter((img) => img.path !== path))
      window.dispatchEvent(new CustomEvent('blog:image-deleted', { detail: { path, url } }))
      toast.success(`Deleted ${name}`)
    } catch {
      toast.error('Failed to delete image')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <aside className="w-full shrink-0 rounded-xl border border-border/50 bg-card p-3 lg:sticky lg:top-20 lg:w-60">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Uploaded images ({images.length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No images uploaded yet
        </p>
      ) : (
        <div className="custom-scrollbar max-h-[60vh] space-y-2 overflow-y-auto pr-0.5">
          {images.map((img) => (
            <div
              key={img.path}
              className="group relative overflow-hidden rounded-lg border border-border/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.name} className="h-20 w-full object-cover" loading="lazy" />
              <button
                type="button"
                aria-label={`Delete ${img.name}`}
                disabled={deleting === img.path}
                onClick={() => handleDelete(img.path, img.name, img.url)}
                className="absolute right-1 top-1 rounded-md bg-background/85 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <p className="truncate border-t border-border/40 bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">
                {img.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
