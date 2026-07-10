import { NextResponse } from 'next/server'
import { getRewardPositions } from '@/lib/rewards/queries'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export async function GET(req: Request): Promise<NextResponse> {
  const ip = getClientIp(req)
  if (isRateLimited(`rewards:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const positions = await getRewardPositions()
    return NextResponse.json({ positions })
  } catch (err) {
    console.error('[rewards] query error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
