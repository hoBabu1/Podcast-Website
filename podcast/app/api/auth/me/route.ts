import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) {
    return NextResponse.json({ user: null })
  }

  // One query returns every paid session this user can access. The client
  // derives per-session access from this list, avoiding a request per card.
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('session_access')
    .select('session_id')
    .eq('user_id', session.userId)

  const accessibleSessions = (data ?? []).map((row) => row.session_id)

  return NextResponse.json({
    user: { email: session.email, userId: session.userId },
    isOwner: session.role === 'owner',
    accessibleSessions,
  })
}
