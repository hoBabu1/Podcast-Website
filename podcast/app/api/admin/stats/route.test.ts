import { NextRequest } from 'next/server'
import { GET } from './route'

process.env.SESSION_SECRET = 'a'.repeat(32)

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/admin/queries', () => ({
  checkOwnerRole: jest.fn(),
  getStats: jest.fn(),
}))

import { getSession } from '@/lib/auth/session'
import { checkOwnerRole, getStats } from '@/lib/admin/queries'

function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/admin/stats')
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/admin/stats', () => {
  it('returns 401 when not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', userId: 'u', role: null })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(false)
    const res = await GET(makeReq())
    expect(res.status).toBe(403)
  })

  it('returns stats for an owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', userId: 'o', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    ;(getStats as jest.Mock).mockResolvedValue({
      totalUsers: 5,
      totalRevenue: 150,
      session2Count: 2,
      session3Count: 1,
    })

    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({
      totalUsers: 5,
      totalRevenue: 150,
      session2Count: 2,
      session3Count: 1,
    })
  })
})
