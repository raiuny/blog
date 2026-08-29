'use client'

import { useEffect, useState } from 'react'
import { BASE_PATH, STATIC_MODE } from '@/lib/client-config'

export interface SessionInfo {
  authenticated: boolean
  login?: string
  name?: string | null
  avatar?: string | null
}

/**
 * Owner login state. Returns null while loading; read-only (authenticated:
 * false) for visitors and in static builds (no auth endpoints there).
 */
export function useSession(): SessionInfo | null {
  const [session, setSession] = useState<SessionInfo | null>(null)

  useEffect(() => {
    if (STATIC_MODE) {
      setSession({ authenticated: false })
      return
    }
    fetch(`${BASE_PATH}/api/auth/session`)
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then(setSession)
      .catch(() => setSession({ authenticated: false }))
  }, [])

  return session
}
