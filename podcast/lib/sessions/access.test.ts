jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserSessionAccess, hasSessionAccess } from './access'

const USER = 'user-123'

// Builds a Supabase mock where `from().select().eq()` resolves to { data }.
function mockAccessRows(data: { session_id: number }[] | null) {
  ;(createServerSupabaseClient as jest.Mock).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data }),
      }),
    }),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('hasSessionAccess', () => {
  it('always returns true for session 1 (free) without hitting the DB', async () => {
    const result = await hasSessionAccess(USER, 1)
    expect(result).toBe(true)
    expect(createServerSupabaseClient).not.toHaveBeenCalled()
  })

  it('returns true when an access row exists for the session', async () => {
    mockAccessRows([{ session_id: 2 }])
    expect(await hasSessionAccess(USER, 2)).toBe(true)
  })

  it('returns false when no access row exists for the session', async () => {
    mockAccessRows([])
    expect(await hasSessionAccess(USER, 2)).toBe(false)
  })

  it('returns false for a session the user has not paid for', async () => {
    mockAccessRows([{ session_id: 2 }])
    expect(await hasSessionAccess(USER, 3)).toBe(false)
  })
})

describe('getUserSessionAccess', () => {
  it('returns the array of session IDs the user has paid for', async () => {
    mockAccessRows([{ session_id: 2 }, { session_id: 3 }])
    expect(await getUserSessionAccess(USER)).toEqual([2, 3])
  })

  it('returns an empty array when the user has no access rows', async () => {
    mockAccessRows([])
    expect(await getUserSessionAccess(USER)).toEqual([])
  })

  it('returns an empty array when the query returns null data', async () => {
    mockAccessRows(null)
    expect(await getUserSessionAccess(USER)).toEqual([])
  })
})
