import { NextRequest } from 'next/server'
import { POST } from './route'

process.env.SESSION_SECRET = 'a'.repeat(32)
process.env.NEXT_PUBLIC_PAYMENT_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
process.env.ALCHEMY_RPC_URL = 'https://alchemy.example.com'

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/web3/verify', () => ({
  verifyUsdcPayment: jest.fn(),
}))

import { getSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyUsdcPayment } from '@/lib/web3/verify'

const VALID_TX = '0x' + 'a'.repeat(64)

const mockSupabase = { from: jest.fn() }

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockAuthSession() {
  ;(getSession as jest.Mock).mockResolvedValue({
    email: 'user@example.com',
    userId: 'user-id',
    role: null,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
})

describe('POST /api/payment/verify', () => {
  it('returns 401 when not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeReq({ txHash: VALID_TX, sessionId: 2 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid sessionId', async () => {
    mockAuthSession()
    const res = await POST(makeReq({ txHash: VALID_TX, sessionId: 1 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed txHash', async () => {
    mockAuthSession()
    const res = await POST(makeReq({ txHash: 'not-a-hash', sessionId: 2 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when txHash is already used', async () => {
    mockAuthSession()
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'existing' } }) }) }),
    }))
    const res = await POST(makeReq({ txHash: VALID_TX, sessionId: 2 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Payment already processed')
  })

  it('returns 400 when on-chain verification fails', async () => {
    mockAuthSession()
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
    }))
    ;(verifyUsdcPayment as jest.Mock).mockResolvedValue({ valid: false, reason: 'wrong_amount' })
    const res = await POST(makeReq({ txHash: VALID_TX, sessionId: 2 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Payment verification failed')
  })

  it('returns 200 and inserts session_access on valid payment', async () => {
    mockAuthSession()
    ;(verifyUsdcPayment as jest.Mock).mockResolvedValue({ valid: true })

    let insertedRow: unknown = null
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'session_access') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
          insert: (row: unknown) => {
            insertedRow = row
            return Promise.resolve({ error: null })
          },
        }
      }
      if (table === 'users') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'user-id' } }) }) }),
        }
      }
    })

    const res = await POST(makeReq({ txHash: VALID_TX, sessionId: 2 }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true })
    expect(insertedRow).toMatchObject({
      session_id: 2,
      tx_hash: VALID_TX,
      chain_id: 84532,
      amount_usdc: '50',
    })
  })

  it('retries a transient insert failure and returns 200 on eventual success', async () => {
    mockAuthSession()
    ;(verifyUsdcPayment as jest.Mock).mockResolvedValue({ valid: true })

    let attempts = 0
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
      insert: () => {
        attempts += 1
        return Promise.resolve(
          attempts < 3 ? { error: { message: 'fetch failed' } } : { error: null }
        )
      },
    }))

    const res = await POST(makeReq({ txHash: VALID_TX, sessionId: 2 }))
    expect(res.status).toBe(200)
    expect(attempts).toBe(3)
  })

  it('returns 503 retryable when the insert fails after all retries', async () => {
    mockAuthSession()
    ;(verifyUsdcPayment as jest.Mock).mockResolvedValue({ valid: true })

    mockSupabase.from.mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
      insert: () => Promise.resolve({ error: { message: 'fetch failed' } }),
    }))

    const res = await POST(makeReq({ txHash: VALID_TX, sessionId: 2 }))
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.retryable).toBe(true)
  })
})
