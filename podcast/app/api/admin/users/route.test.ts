import { NextRequest } from 'next/server'
import { GET } from './route'

process.env.SESSION_SECRET = 'a'.repeat(32)

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/admin/queries', () => ({
  checkOwnerRole: jest.fn(),
  getUsers: jest.fn(),
}))

import { getSession } from '@/lib/auth/session'
import { checkOwnerRole, getUsers } from '@/lib/admin/queries'

function makeReq(query = ''): NextRequest {
  return new NextRequest(`http://localhost/api/admin/users${query}`)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/admin/users', () => {
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

  it('returns paginated users for an owner and passes page + search through', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', userId: 'o', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    ;(getUsers as jest.Mock).mockResolvedValue({
      users: [{ id: 'u1', name: 'Alice', email: 'alice@example.com', wallet_addresses: [], created_at: '2026-01-01', sessions_unlocked: [1] }],
      total: 1,
    })

    const res = await GET(makeReq('?page=2&search=ali'))
    expect(res.status).toBe(200)
    expect(getUsers).toHaveBeenCalledWith(2, 'ali')

    const data = await res.json()
    expect(data.total).toBe(1)
    expect(data.users).toHaveLength(1)
  })
})
