'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'

interface SessionAccessState {
  hasAccess: boolean
  isLoading: boolean
}

/**
 * Derives access from the shared auth context — no per-card network call.
 * Session 1 is always free. Access for paid sessions comes from the single
 * `/api/auth/me` fetch done at the app root.
 */
export function useSessionAccess(sessionId: number): SessionAccessState {
  const { accessibleSessions, isLoading } = useAuthContext()
  const hasAccess = sessionId === 1 || accessibleSessions.includes(sessionId)
  return { hasAccess, isLoading }
}
