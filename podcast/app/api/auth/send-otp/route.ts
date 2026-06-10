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

  try {
    await cleanupExpiredOtps(email)
    const code = generateOtp()
    await storeOtp(email, code)

    // Fire-and-forget: don't make the user wait on Brevo's API. The OTP is
    // already stored, so verification works the moment the email arrives.
    sendOtpEmail(email, code).catch((err) => {
      logger.error({ err }, 'Failed to send OTP email')
    })

    return NextResponse.json({ success: true })
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
}
