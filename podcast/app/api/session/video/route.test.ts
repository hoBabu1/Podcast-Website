import { NextRequest } from 'next/server'
import { GET } from './route'

process.env.SESSION_SECRET = 'a'.repeat(32)
process.env.YOUTUBE_SESSION_1_ID = 'placeholder_session_1'
process.env.YOUTUBE_SESSION_2_ID = 'placeholder_session_2'
process.env.YOUTUBE_SESSION_3_ID = 'real_video_id_abc123'

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/sessions/access', () => ({
  hasSessionAccess: jest.fn(),
}))

import { getSession } from '@/lib/auth/session'
import { hasSessionAccess } from '@/lib/sessions/access'

function makeReq(sessionId?: string): NextRequest {
  const url = sessionId
    ? `http://localhost/api/session/video?sessionId=${sessionId}`
    : 'http://localhost/api/session/video'
  return new NextRequest(url)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/session/video', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await GET(makeReq('1'))
    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid sessionId', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', userId: 'u', role: null })
    const res = await GET(makeReq('99'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when sessionId is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', userId: 'u', role: null })
    const res = await GET(makeReq())
    expect(res.status).toBe(400)
  })

  it('returns 200 with embedUrl for session 1 (always free)', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', userId: 'u', role: null })
    const res = await GET(makeReq('1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.embedUrl).toContain('youtube-nocookie.com/embed/')
    expect(data.isPlaceholder).toBe(true)
  })

  it('returns 403 for session 2 when user has not paid', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', userId: 'u', role: null })
    ;(hasSessionAccess as jest.Mock).mockResolvedValue(false)
    const res = await GET(makeReq('2'))
    expect(res.status).toBe(403)
  })

  it('returns 200 with embedUrl for session 2 when user has paid', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', userId: 'u', role: null })
    ;(hasSessionAccess as jest.Mock).mockResolvedValue(true)
    const res = await GET(makeReq('2'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.embedUrl).toContain('youtube-nocookie.com/embed/')
    expect(data.isPlaceholder).toBe(true)
  })

  it('returns isPlaceholder: false when video ID does not start with placeholder_', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', userId: 'u', role: null })
    ;(hasSessionAccess as jest.Mock).mockResolvedValue(true)
    // Session 3 has 'real_video_id_abc123' set above
    const res = await GET(makeReq('3'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.isPlaceholder).toBe(false)
    expect(data.embedUrl).toContain('real_video_id_abc123')
  })
})
