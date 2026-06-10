import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/session'

export function POST(): NextResponse {
  const res = NextResponse.json({ success: true })
  res.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  )
  return res
}
