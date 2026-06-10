process.env.SUPABASE_URL = 'https://supabase.example.com'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getStats,
  getUsers,
  getPayments,
  checkOwnerRole,
} from './queries'

/**
 * Builds a chainable Supabase query mock. Every builder method returns the same
 * object so calls can be chained in any order, and the object is awaitable
 * (resolves to `result`). `single()` resolves to `result` too.
 */
function builder(result: unknown) {
  const q: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'or', 'order', 'range', 'in']) {
    q[method] = jest.fn(() => q)
  }
  q.single = jest.fn(() => Promise.resolve(result))
  q.then = (resolve: (value: unknown) => unknown) => resolve(result)
  return q
}

const mockSupabase = { from: jest.fn() }

beforeEach(() => {
  jest.clearAllMocks()
  ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
})

describe('getStats', () => {
  it('returns correct counts and summed revenue', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') return builder({ count: 3 })
      if (table === 'session_access') {
        return builder({
          data: [
            { session_id: 2, amount_usdc: '50' },
            { session_id: 2, amount_usdc: '50' },
            { session_id: 3, amount_usdc: '100' },
          ],
        })
      }
      return builder({ data: [] })
    })

    const stats = await getStats()
    expect(stats).toEqual({
      totalUsers: 3,
      totalRevenue: 200,
      session2Count: 2,
      session3Count: 1,
    })
  })
})

describe('getUsers', () => {
  it('returns paginated results enriched with wallets and sessions', async () => {
    const usersBuilder = builder({
      data: [
        { id: 'u1', name: 'Alice', email: 'alice@example.com', created_at: '2026-01-01' },
      ],
      count: 1,
    })
    const walletsBuilder = builder({
      data: [{ user_id: 'u1', wallet_address: '0xabc' }],
    })
    const accessBuilder = builder({
      data: [{ user_id: 'u1', session_id: 2 }],
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') return usersBuilder
      if (table === 'user_wallets') return walletsBuilder
      return accessBuilder
    })

    const { users, total } = await getUsers(1, '')

    expect(total).toBe(1)
    expect(usersBuilder.range).toHaveBeenCalledWith(0, 19)
    expect(usersBuilder.or).not.toHaveBeenCalled()
    expect(users).toEqual([
      {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        wallet_addresses: ['0xabc'],
        created_at: '2026-01-01',
        sessions_unlocked: [1, 2],
      },
    ])
  })

  it('filters by search term across name and email', async () => {
    const usersBuilder = builder({ data: [], count: 0 })
    mockSupabase.from.mockImplementation(() => usersBuilder)

    await getUsers(2, 'ali')

    expect(usersBuilder.range).toHaveBeenCalledWith(20, 39)
    expect(usersBuilder.or).toHaveBeenCalledWith(
      'name.ilike.%ali%,email.ilike.%ali%'
    )
  })
})

describe('getPayments', () => {
  it('returns payments sorted most recent first with payer email', async () => {
    const paymentsBuilder = builder({
      data: [
        {
          id: 'p1',
          user_id: 'u1',
          session_id: 2,
          amount_usdc: '50',
          tx_hash: '0xtx',
          chain_id: 84532,
          granted_at: '2026-02-01',
        },
      ],
      count: 1,
    })
    const usersBuilder = builder({ data: [{ id: 'u1', email: 'alice@example.com' }] })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'session_access') return paymentsBuilder
      return usersBuilder
    })

    const { payments, total } = await getPayments(1)

    expect(total).toBe(1)
    expect(paymentsBuilder.order).toHaveBeenCalledWith('granted_at', {
      ascending: false,
    })
    expect(payments).toEqual([
      {
        id: 'p1',
        user_email: 'alice@example.com',
        session_id: 2,
        amount_usdc: 50,
        tx_hash: '0xtx',
        chain_id: 84532,
        granted_at: '2026-02-01',
      },
    ])
  })
})

describe('checkOwnerRole', () => {
  it('returns true for an owner email', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: { role: 'owner' } }))
    expect(await checkOwnerRole('owner@example.com')).toBe(true)
  })

  it('returns false for a non-owner email', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: null }))
    expect(await checkOwnerRole('user@example.com')).toBe(false)
  })
})
