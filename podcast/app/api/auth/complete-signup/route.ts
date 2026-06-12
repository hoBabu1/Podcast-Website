import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSession, makeSessionCookie } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { addContact, sendWelcomeEmail } from '@/lib/brevo/client'
import type { UserRow } from '@/lib/supabase/types'
import { logger } from '@/lib/logger'

const RequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = RequestSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { name } = body.data
  const email = body.data.email.trim().toLowerCase()

  try {
    const supabase = createServerSupabaseClient()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)

    if ((existing as Pick<UserRow, 'id'>[] | null)?.[0]) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 })
    }

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({ email, name })
      .select('id')
      .single()

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? 'Insert failed')
    }

    await addContact(name, email)
    await sendWelcomeEmail(name, email)

    const token = await createSession(email, (inserted as Pick<UserRow, 'id'>).id, null, name)
    const res = NextResponse.json({ success: true })
    res.headers.set('Set-Cookie', makeSessionCookie(token))
    return res
  } catch (err) {
    logger.error({ err }, 'complete-signup failed')
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
