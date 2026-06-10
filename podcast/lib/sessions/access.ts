import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Session access logic. Server-side only — these read the database with the
 * service-role client, so they must never be imported into a Client Component.
 *
 * Session 1 is free: it has no row in `session_access` and is always accessible.
 * Paid access (sessions 2 & 3) is granted by a row inserted only after on-chain
 * payment verification in `/api/payment/verify`.
 */

/** Returns the session IDs a user has paid for, e.g. `[2]` or `[2, 3]`. */
export async function getUserSessionAccess(userId: string): Promise<number[]> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('session_access')
    .select('session_id')
    .eq('user_id', userId)

  return (data ?? []).map((row) => row.session_id)
}

/** True if the user can access this session. Session 1 is always free. */
export async function hasSessionAccess(userId: string, sessionId: number): Promise<boolean> {
  if (sessionId === 1) return true

  const accessible = await getUserSessionAccess(userId)
  return accessible.includes(sessionId)
}
