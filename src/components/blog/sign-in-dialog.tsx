'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { LogIn, Loader2 } from 'lucide-react'
import { BASE_PATH } from '@/lib/client-config'

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        return
      }
      toast.success(`Welcome back, ${data.login}`)
      setOpen(false)
      window.location.reload()
    } catch {
      toast.error('Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign in
            </DialogTitle>
            <DialogDescription>
              Owner login only. Visitors can read all posts without signing in.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9"
              />
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Sign in
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
