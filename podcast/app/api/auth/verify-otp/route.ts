import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyOtp } from '@/lib/auth/otp'
import { createSession, makeSessionCookie } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserRow, UserRoleRow } from '@/lib/supabase/types'
import { logger } from '@/lib/logger'

const RequestSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Must be a 6-digit numeric code'),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = RequestSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { code } = body.data
  const email = body.data.email.trim().toLowerCase()

  try {
    const result = await verifyOtp(email, code)
    if (!result.valid) {
      const messages: Record<string, string> = {
        expired: 'Code expired',
        used: 'Code already used',
        invalid: 'Invalid code',
        too_many_attempts: 'Too many attempts',
      }
      return NextResponse.json(
        { error: messages[result.reason ?? 'invalid'] ?? 'Invalid code' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    // User + role lookups are independent (both keyed on email), so run them in
    // parallel — one round trip of latency instead of two on the login path.
    const [usersRes, roleRes] = await Promise.all([
      supabase.from('users').select('id, name').eq('email', email).limit(1),
      supabase.from('user_roles').select('role').eq('email', email).limit(1),
    ])

    const existingUser = (usersRes.data as Pick<UserRow, 'id' | 'name'>[] | null)?.[0]

    if (!existingUser) {
      return NextResponse.json({ verified: true, isNewUser: true })
    }

    const role = (roleRes.data as Pick<UserRoleRow, 'role'>[] | null)?.[0]?.role ?? null

    const token = await createSession(
      email,
      existingUser.id,
      role === 'owner' ? 'owner' : null,
      existingUser.name
    )
    const res = NextResponse.json({ verified: true, isNewUser: false })
    res.headers.set('Set-Cookie', makeSessionCookie(token))
    return res
  } catch (err) {
    logger.error({ err }, 'verify-otp failed')
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
