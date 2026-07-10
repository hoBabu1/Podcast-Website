import { GET } from './route'

jest.mock('@/lib/rewards/queries', () => ({
  getRewardPositions: jest.fn(),
}))

import { getRewardPositions } from '@/lib/rewards/queries'

function makeReq(ip = '1.2.3.4'): Request {
  return new Request('http://localhost/api/rewards', {
    headers: { 'x-forwarded-for': ip },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/rewards', () => {
  it('returns the public list of reward positions', async () => {
    ;(getRewardPositions as jest.Mock).mockResolvedValue([{ id: 'r1' }])

    const res = await GET(makeReq('9.9.9.1'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.positions).toEqual([{ id: 'r1' }])
  })

  it('returns 500 when the query layer throws', async () => {
    ;(getRewardPositions as jest.Mock).mockRejectedValue(new Error('db down'))

    const res = await GET(makeReq('9.9.9.2'))
    expect(res.status).toBe(500)
  })

  it('rate-limits repeated requests from the same IP', async () => {
    ;(getRewardPositions as jest.Mock).mockResolvedValue([])

    const ip = '9.9.9.3'
    let lastStatus = 200
    for (let i = 0; i < 31; i++) {
      const res = await GET(makeReq(ip))
      lastStatus = res.status
    }

    expect(lastStatus).toBe(429)
  })
})
