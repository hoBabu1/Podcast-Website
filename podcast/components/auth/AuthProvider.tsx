'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ServerAuthState } from '@/lib/auth/serverAuth'

export interface AuthUser {
  email: string
  userId: string
}

export interface AuthContextValue {
  user: AuthUser | null
  isOwner: boolean
  isLoading: boolean
  /** Session IDs the logged-in user already has paid access to. */
  accessibleSessions: number[]
  /** Re-fetch auth + access state (e.g. after a successful payment). */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface MeResponse {
  user: AuthUser | null
  isOwner?: boolean
  accessibleSessions?: number[]
}

export function AuthProvider({
  children,
  initialAuth,
}: {
  children: React.ReactNode
  initialAuth: ServerAuthState
}) {
  const [user, setUser] = useState<AuthUser | null>(initialAuth.user)
  const [isOwner, setIsOwner] = useState(initialAuth.isOwner)
  const [accessibleSessions, setAccessibleSessions] = useState<number[]>(
    initialAuth.accessibleSessions
  )
  // Server already resolved auth before first paint, so there is no loading phase.
  const isLoading = false

  // Keep client state in sync with the server. After login / sign-out the auth
  // components call router.refresh(), which re-runs the root layout and pushes a
  // fresh `initialAuth` down here — this picks it up so stale access never sticks.
  useEffect(() => {
    setUser(initialAuth.user)
    setIsOwner(initialAuth.isOwner)
    setAccessibleSessions(initialAuth.accessibleSessions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAuth.user?.userId, initialAuth.isOwner, initialAuth.accessibleSessions.join(',')])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = (await res.json()) as MeResponse
      setUser(data.user)
      setIsOwner(data.isOwner ?? false)
      setAccessibleSessions(data.accessibleSessions ?? [])
    } catch {
      // keep current state on a transient network error
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isOwner, isLoading, accessibleSessions, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider')
  return ctx
}
