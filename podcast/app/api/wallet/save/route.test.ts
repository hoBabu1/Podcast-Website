import { NextRequest } from 'next/server'
import { POST } from './route'

process.env.SESSION_SECRET = 'a'.repeat(32)

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

import { getSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_ADDRESS = '0xAbCd1234567890123456789012345678901234EF'

const mockSupabase = { from: jest.fn() }

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/wallet/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
  ;(getSession as jest.Mock).mockResolvedValue({
    email: 'user@example.com',
    userId: 'user-id',
    role: null,
  })
})

describe('POST /api/wallet/save', () => {
  it('returns 401 when not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeReq({ walletAddress: VALID_ADDRESS }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid Ethereum address', async () => {
    const res = await POST(makeReq({ walletAddress: 'not-an-address' }))
    expect(res.status).toBe(400)
  })

  it('inserts a new wallet and returns 200', async () => {
    let insertCalled = false
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
      }),
      insert: () => {
        insertCalled = true
        return Promise.resolve({ error: null })
      },
    }))

    const res = await POST(makeReq({ walletAddress: VALID_ADDRESS }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(insertCalled).toBe(true)
  })

  it('returns 200 silently when wallet already exists for this user', async () => {
    let insertCalled = false
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'existing' } }) }) }),
      }),
      insert: () => {
        insertCalled = true
        return Promise.resolve({ error: null })
      },
    }))

    const res = await POST(makeReq({ walletAddress: VALID_ADDRESS }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(insertCalled).toBe(false)
  })
})
