import { NextRequest } from 'next/server'
import { POST } from './route'

process.env.SESSION_SECRET = 'a'.repeat(32)

jest.mock('@/lib/auth/otp', () => ({
  verifyOtp: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}))

import { verifyOtp } from '@/lib/auth/otp'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const mockSupabase = {
  from: jest.fn(),
}

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
})

describe('POST /api/auth/verify-otp', () => {
  it('returns { verified: true, isNewUser: true } for valid code + new user', async () => {
    ;(verifyOtp as jest.Mock).mockResolvedValue({ valid: true })
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: [] }) }) }),
    }))

    const res = await POST(makeReq({ email: 'new@example.com', code: '123456' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ verified: true, isNewUser: true })
  })

  it('returns { verified: true, isNewUser: false } and sets cookie for existing user', async () => {
    ;(verifyOtp as jest.Mock).mockResolvedValue({ valid: true })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({ limit: () => Promise.resolve({ data: [{ id: 'user-id' }] }) }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({ limit: () => Promise.resolve({ data: [] }) }),
        }),
      }
    })

    const res = await POST(makeReq({ email: 'existing@example.com', code: '123456' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ verified: true, isNewUser: false })
    expect(res.headers.get('Set-Cookie')).toMatch(/defilords_session=/)
  })

  it('returns 400 for invalid code', async () => {
    ;(verifyOtp as jest.Mock).mockResolvedValue({ valid: false, reason: 'invalid' })
    const res = await POST(makeReq({ email: 'user@example.com', code: '000000' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing fields', async () => {
    const res = await POST(makeReq({ email: 'user@example.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-numeric code', async () => {
    const res = await POST(makeReq({ email: 'user@example.com', code: 'abcdef' }))
    expect(res.status).toBe(400)
  })
})
