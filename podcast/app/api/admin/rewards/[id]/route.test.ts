import { NextRequest } from 'next/server'
import { PATCH, DELETE } from './route'

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/admin/queries', () => ({
  checkOwnerRole: jest.fn(),
}))

jest.mock('@/lib/rewards/queries', () => ({
  updateRewardPosition: jest.fn(),
  deleteRewardPosition: jest.fn(),
}))

import { getSession } from '@/lib/auth/session'
import { checkOwnerRole } from '@/lib/admin/queries'
import { updateRewardPosition, deleteRewardPosition } from '@/lib/rewards/queries'

function makePatchReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/rewards/r1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

function makeDeleteReq(): NextRequest {
  return new NextRequest('http://localhost/api/admin/rewards/r1', { method: 'DELETE' })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PATCH /api/admin/rewards/:id', () => {
  it('returns 401 when not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await PATCH(makePatchReq({ current_yield: 5 }), { params: { id: 'r1' } })
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', role: null })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(false)
    const res = await PATCH(makePatchReq({ current_yield: 5 }), { params: { id: 'r1' } })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid input', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    const res = await PATCH(makePatchReq({ status: 'bogus' }), { params: { id: 'r1' } })
    expect(res.status).toBe(400)
  })

  it('returns 404 when the position does not exist', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    ;(updateRewardPosition as jest.Mock).mockResolvedValue(null)

    const res = await PATCH(makePatchReq({ current_yield: 5 }), { params: { id: 'missing' } })
    expect(res.status).toBe(404)
  })

  it('updates the position for an owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    ;(updateRewardPosition as jest.Mock).mockResolvedValue({ id: 'r1', current_yield: 5 })

    const res = await PATCH(makePatchReq({ current_yield: 5 }), { params: { id: 'r1' } })
    expect(res.status).toBe(200)
    expect(updateRewardPosition).toHaveBeenCalledWith('r1', { current_yield: 5 })
  })
})

describe('DELETE /api/admin/rewards/:id', () => {
  it('returns 401 when not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await DELETE(makeDeleteReq(), { params: { id: 'r1' } })
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'u@x.com', role: null })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(false)
    const res = await DELETE(makeDeleteReq(), { params: { id: 'r1' } })
    expect(res.status).toBe(403)
  })

  it('deletes the position for an owner', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ email: 'o@x.com', role: 'owner' })
    ;(checkOwnerRole as jest.Mock).mockResolvedValue(true)
    ;(deleteRewardPosition as jest.Mock).mockResolvedValue(undefined)

    const res = await DELETE(makeDeleteReq(), { params: { id: 'r1' } })
    expect(res.status).toBe(200)
    expect(deleteRewardPosition).toHaveBeenCalledWith('r1')
  })
})
