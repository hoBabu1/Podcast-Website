import { cookies } from 'next/headers'
import { SESSION_COOKIE, getSession } from './session'
import { getUserSessionAccess } from '@/lib/sessions/access'

export interface ServerAuthState {
  user: { email: string; userId: string; name: string } | null
  isOwner: boolean
  /** Session IDs the logged-in user has paid for. Empty when logged out. */
  accessibleSessions: number[]
}

/**
 * Reads and verifies the session cookie inside a Server Component / route.
 * `getSession` takes a Request, so we wrap the cookie into a minimal one here.
 */
export async function getServerSession() {
  const token = cookies().get(SESSION_COOKIE)?.value ?? ''
  const req = new Request('http://localhost', {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  })
  return getSession(req)
}

/**
 * Resolves the user's full auth + access state on the server in one place. Used
 * by the root layout to hand the client correct state on the very first paint —
 * no client round trip, no "checking access" flash.
 */
export async function getServerAuthState(): Promise<ServerAuthState> {
  const session = await getServerSession()
  if (!session) {
    return { user: null, isOwner: false, accessibleSessions: [] }
  }

  return {
    user: { email: session.email, userId: session.userId, name: session.name },
    isOwner: session.role === 'owner',
    accessibleSessions: await getUserSessionAccess(session.userId),
  }
}
