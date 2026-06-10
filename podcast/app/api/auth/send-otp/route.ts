import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateOtp, storeOtp, cleanupExpiredOtps } from '@/lib/auth/otp'
import { sendOtpEmail } from '@/lib/brevo/client'
import { logger } from '@/lib/logger'

const RequestSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = RequestSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Normalize so access keys consistently to one account regardless of casing
  const email = body.data.email.trim().toLowerCase()

  let code: string
  try {
    await cleanupExpiredOtps(email)
    code = generateOtp()
    await storeOtp(email, code)
  } catch (err) {
    if (err instanceof Error && err.message === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        { status: 429 }
      )
    }
    logger.error({ err }, 'send-otp failed')
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }

  // Await the send so the serverless function stays alive until Brevo responds.
  // A fire-and-forget promise gets frozen when the function returns on Vercel,
  // so the email would never actually go out. If Brevo fails, surface a real
  // error instead of a fake success — the client shows "Failed to send code".
  try {
    await sendOtpEmail(email, code)
  } catch (err) {
    logger.error({ err }, 'Failed to send OTP email')
    return NextResponse.json(
      { error: 'Could not send the verification email. Please try again.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
