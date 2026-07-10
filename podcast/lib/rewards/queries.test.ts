process.env.SUPABASE_URL = 'https://supabase.example.com'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getRewardPositions,
  getRewardPositionById,
  createRewardPosition,
  updateRewardPosition,
  deleteRewardPosition,
} from './queries'

function builder(result: unknown) {
  const q: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'order', 'insert', 'update', 'delete']) {
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

const row = {
  id: 'r1',
  session_id: 2,
  winner_label: 'Alice',
  vault_name: 'AI Vault A',
  sponsored_amount: 100,
  start_date: '2026-07-01',
  end_date: '2026-07-15',
  current_yield: 4.2,
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
}

describe('getRewardPositions', () => {
  it('returns all rows ordered by start_date descending', async () => {
    const b = builder({ data: [row] })
    mockSupabase.from.mockReturnValue(b)

    const result = await getRewardPositions()

    expect(mockSupabase.from).toHaveBeenCalledWith('reward_positions')
    expect(b.order).toHaveBeenCalledWith('start_date', { ascending: false })
    expect(result).toEqual([row])
  })

  it('returns an empty array when no data is returned', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: null }))
    expect(await getRewardPositions()).toEqual([])
  })
})

describe('getRewardPositionById', () => {
  it('returns the row when found', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: row }))
    expect(await getRewardPositionById('r1')).toEqual(row)
  })

  it('returns null when not found', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: null }))
    expect(await getRewardPositionById('missing')).toBeNull()
  })
})

describe('createRewardPosition', () => {
  it('inserts and returns the created row', async () => {
    const b = builder({ data: row, error: null })
    mockSupabase.from.mockReturnValue(b)

    const input = {
      session_id: 2 as const,
      winner_label: 'Alice',
      vault_name: 'AI Vault A',
      sponsored_amount: 100,
      start_date: '2026-07-01',
      end_date: '2026-07-15',
    }
    const result = await createRewardPosition(input)

    expect(b.insert).toHaveBeenCalledWith(input)
    expect(result).toEqual(row)
  })

  it('throws when Supabase returns an error', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: null, error: new Error('boom') }))
    await expect(
      createRewardPosition({
        session_id: 1,
        winner_label: 'Bob',
        vault_name: 'Vault',
        sponsored_amount: 50,
        start_date: '2026-07-01',
        end_date: '2026-07-15',
      })
    ).rejects.toThrow('boom')
  })
})

describe('updateRewardPosition', () => {
  it('updates and returns the row', async () => {
    const updated = { ...row, current_yield: 10 }
    const b = builder({ data: updated, error: null })
    mockSupabase.from.mockReturnValue(b)

    const result = await updateRewardPosition('r1', { current_yield: 10 })

    expect(b.update).toHaveBeenCalledWith({ current_yield: 10 })
    expect(b.eq).toHaveBeenCalledWith('id', 'r1')
    expect(result).toEqual(updated)
  })

  it('throws when Supabase returns an error', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: null, error: new Error('fail') }))
    await expect(updateRewardPosition('r1', { current_yield: 10 })).rejects.toThrow('fail')
  })
})

describe('deleteRewardPosition', () => {
  it('deletes the row by id', async () => {
    const b = builder({ error: null })
    mockSupabase.from.mockReturnValue(b)

    await deleteRewardPosition('r1')

    expect(b.delete).toHaveBeenCalled()
    expect(b.eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('throws when Supabase returns an error', async () => {
    mockSupabase.from.mockReturnValue(builder({ error: new Error('nope') }))
    await expect(deleteRewardPosition('r1')).rejects.toThrow('nope')
  })
})
