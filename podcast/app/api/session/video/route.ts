import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { hasSessionAccess } from '@/lib/sessions/access'

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

  if (sessionId !== 1) {
    const allowed = await hasSessionAccess(session.userId, sessionId)
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const videoIds: Record<number, string | undefined> = {
    1: process.env.YOUTUBE_SESSION_1_ID,
    2: process.env.YOUTUBE_SESSION_2_ID,
    3: process.env.YOUTUBE_SESSION_3_ID,
  }

  const videoId = videoIds[sessionId]
  if (!videoId) {
    return NextResponse.json({ error: 'Video not configured' }, { status: 404 })
  }

  return NextResponse.json({
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&playsinline=1`,
    isPlaceholder: videoId.startsWith('placeholder_'),
  })
}
