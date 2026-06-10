'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'

/**
 * Thin wrapper over the shared AuthProvider context. Auth state is fetched
 * once at the app root, so every consumer reads the same data with no extra
 * network requests.
 */
export function useAuth() {
  const { user, isOwner, isLoading } = useAuthContext()
  return { user, isOwner, isLoading }
}
