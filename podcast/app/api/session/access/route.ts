import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const QuerySchema = z.object({
  sessionId: z.coerce.number().int().min(1).max(3),
})

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = QuerySchema.safeParse({ sessionId: searchParams.get('sessionId') })
  if (!query.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { sessionId } = query.data

  // Session 1 is always free — no DB check needed
  if (sessionId === 1) return NextResponse.json({ hasAccess: true })

  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('session_access')
    .select('id')
    .eq('user_id', session.userId)
    .eq('session_id', sessionId)
    .single()

  return NextResponse.json({ hasAccess: !!data })
}
