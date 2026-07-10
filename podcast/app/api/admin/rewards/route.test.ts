import { NextRequest } from 'next/server'
import { GET, POST } from './route'

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/admin/queries', () => ({
  checkOwnerRole: jest.fn(),
}))

jest.mock('@/lib/rewards/queries', () => ({
  getRewardPositions: jest.fn(),
  createRewardPosition: jest.fn(),
}))

import { getSession } from '@/lib/auth/session'
import { checkOwnerRole } from '@/lib/admin/queries'
import { getRewardPositions, createRewardPosition } from '@/lib/rewards/queries'

function makeGetReq(): NextRequest {
  return new NextRequest('http://localhost/api/admin/rewards')
}

function makePostReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/rewards', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const validInput = {
  session_id: 2,
  winner_label: 'Alice',
  vault_name: 'AI Vault A',
  sponsored_amount: 100,
  start_date: '2026-07-01',
  end_date: '2026-07-15',
  current_yield: 0,
  status: 'active',
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/admin/rewards', () => {
  it('returns 401 when not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await GET(makeGetReq())
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', role: null })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(false)
    const res = await GET(makeGetReq())
    expect(res.status).toBe(403)
  })

  it('returns the reward positions for an owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    ;(getRewardPositions as jest.Mock).mockResolvedValue([{ id: 'r1' }])

    const res = await GET(makeGetReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.positions).toEqual([{ id: 'r1' }])
  })
})

describe('POST /api/admin/rewards', () => {
  it('returns 401 when not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makePostReq(validInput))
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', role: null })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(false)
    const res = await POST(makePostReq(validInput))
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid input', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)

    const res = await POST(makePostReq({ ...validInput, session_id: 4 }))
    expect(res.status).toBe(400)
  })

  it('creates a reward position for an owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    ;(createRewardPosition as jest.Mock).mockResolvedValue({ id: 'r1', ...validInput })

    const res = await POST(makePostReq(validInput))
    expect(res.status).toBe(201)
    expect(createRewardPosition).toHaveBeenCalledWith(validInput)
  })
})
