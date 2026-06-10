import { generateOtp, storeOtp, verifyOtp } from './otp'

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'

const mockSupabase = {
  from: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
})

// ─── generateOtp ───────────────────────────────────────────────────────────

describe('generateOtp', () => {
  it('returns a 6-digit numeric string', () => {
    const otp = generateOtp()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('is zero-padded to 6 digits', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0)
    expect(generateOtp()).toBe('000000')
    jest.spyOn(Math, 'random').mockRestore()
  })
})

// ─── storeOtp ──────────────────────────────────────────────────────────────

describe('storeOtp', () => {
  it('throws RATE_LIMIT when 3 or more OTPs exist in the last 15 minutes', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gte: () => Promise.resolve({ data: [{ id: '1' }, { id: '2' }, { id: '3' }] }),
        }),
      }),
    }))

    await expect(storeOtp('user@example.com', '123456')).rejects.toThrow('RATE_LIMIT')
  })

  it('inserts a new OTP row when under rate limit', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gte: () => Promise.resolve({ data: [] }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }))

    await expect(storeOtp('user@example.com', '123456')).resolves.toBeUndefined()
  })
})

// ─── verifyOtp ─────────────────────────────────────────────────────────────

describe('verifyOtp', () => {
  function makeRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'otp-id',
      code: '123456',
      used: false,
      attempts: 0,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      ...overrides,
    }
  }

  function mockFromWithRow(row: unknown | null) {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: row ? [row] : [] }),
          }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }))
  }

  it('returns valid:true for correct, unexpired, unused code', async () => {
    mockFromWithRow(makeRow())
    const result = await verifyOtp('user@example.com', '123456')
    expect(result).toEqual({ valid: true })
  })

  it('returns invalid when no OTP exists', async () => {
    mockFromWithRow(null)
    const result = await verifyOtp('user@example.com', '999999')
    expect(result).toEqual({ valid: false, reason: 'invalid' })
  })

  it('returns used when OTP is already marked used', async () => {
    mockFromWithRow(makeRow({ used: true }))
    const result = await verifyOtp('user@example.com', '123456')
    expect(result).toEqual({ valid: false, reason: 'used' })
  })

  it('returns expired when OTP has passed expiry', async () => {
    mockFromWithRow(makeRow({ expires_at: new Date(Date.now() - 1000).toISOString() }))
    const result = await verifyOtp('user@example.com', '123456')
    expect(result).toEqual({ valid: false, reason: 'expired' })
  })

  it('returns too_many_attempts when attempts >= 3', async () => {
    mockFromWithRow(makeRow({ attempts: 3 }))
    const result = await verifyOtp('user@example.com', '123456')
    expect(result).toEqual({ valid: false, reason: 'too_many_attempts' })
  })

  it('returns invalid for wrong code', async () => {
    mockFromWithRow(makeRow({ attempts: 0 }))
    const result = await verifyOtp('user@example.com', '000000')
    expect(result).toEqual({ valid: false, reason: 'invalid' })
  })

  it('returns too_many_attempts when wrong code brings attempts to 3', async () => {
    mockFromWithRow(makeRow({ attempts: 2 }))
    const result = await verifyOtp('user@example.com', '000000')
    expect(result).toEqual({ valid: false, reason: 'too_many_attempts' })
  })
})
