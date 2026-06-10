import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/serverAuth'
import { hasSessionAccess } from '@/lib/sessions/access'
import { SessionContent } from '@/components/sessions/SessionContent'
import { SESSIONS } from '@/constants/sessions'

/**
 * Server-side access gate for a session. Runs entirely on the server before any
 * HTML is sent, so a user without access never receives the content at all.
 */
export default async function SessionPage({ params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session) {
    // Not logged in — middleware also guards this, this is defence in depth.
    redirect('/login')
  }

  const sessionId = Number(params.id)
  const exists = SESSIONS.some((s) => s.id === sessionId)
  if (!exists) {
    redirect('/')
  }

  // Session 1 is free → hasSessionAccess returns true. Sessions 2 & 3 require a
  // paid row in session_access.
  const allowed = await hasSessionAccess(session.userId, sessionId)
  if (!allowed) {
    // Send them home with a flag so the matching card can prompt to pay.
    redirect(`/?locked=${sessionId}`)
  }

  return <SessionContent sessionId={sessionId} />
}
