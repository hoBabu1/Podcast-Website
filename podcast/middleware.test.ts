import { NextRequest } from 'next/server'

process.env.SESSION_SECRET = 'a'.repeat(32)

jest.mock('@/lib/auth/session', () => ({
  SESSION_COOKIE: 'defilords_session',
  getSession: jest.fn(),
}))

import { middleware } from './middleware'
import { getSession } from '@/lib/auth/session'

function makeReq(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`)
}

describe('middleware', () => {
  beforeEach(() => jest.clearAllMocks())

  it('redirects unauthenticated request to /sessions/1 → /login', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await middleware(makeReq('/sessions/1'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects unauthenticated request to /admin → /login', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await middleware(makeReq('/admin'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects authenticated non-owner to /admin → /', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({
      email: 'user@example.com',
      userId: 'user-id',
      role: null,
    })
    const res = await middleware(makeReq('/admin'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('passes authenticated owner through to /admin', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({
      email: 'owner@example.com',
      userId: 'owner-id',
      role: 'owner',
    })
    const res = await middleware(makeReq('/admin'))
    expect(res.status).toBe(200)
  })

  it('always passes public routes through', async () => {
    const res = await middleware(makeReq('/'))
    expect(res.status).toBe(200)
    expect(getSession).not.toHaveBeenCalled()
  })
})
