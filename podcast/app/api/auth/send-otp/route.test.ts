import { NextRequest } from 'next/server'
import { POST } from './route'

jest.mock('@/lib/auth/otp', () => ({
  generateOtp: jest.fn().mockReturnValue('123456'),
  storeOtp: jest.fn().mockResolvedValue(undefined),
  cleanupExpiredOtps: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/brevo/client', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}))

import { storeOtp, cleanupExpiredOtps } from '@/lib/auth/otp'
import { sendOtpEmail } from '@/lib/brevo/client'

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/send-otp', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 for a valid email', async () => {
    const res = await POST(makeReq({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true })
    expect(cleanupExpiredOtps).toHaveBeenCalledWith('user@example.com')
    expect(storeOtp).toHaveBeenCalledWith('user@example.com', '123456')
    expect(sendOtpEmail).toHaveBeenCalledWith('user@example.com', '123456')
  })

  it('returns 400 for an invalid email', async () => {
    const res = await POST(makeReq({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing email', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('returns 429 when storeOtp throws RATE_LIMIT', async () => {
    ;(storeOtp as jest.Mock).mockRejectedValueOnce(new Error('RATE_LIMIT'))
    const res = await POST(makeReq({ email: 'user@example.com' }))
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toMatch(/too many/i)
  })
})
