import { NextRequest } from 'next/server'
import { POST } from './route'

process.env.SESSION_SECRET = 'a'.repeat(32)

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/brevo/client', () => ({
  addContact: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { addContact, sendWelcomeEmail } from '@/lib/brevo/client'

const mockSupabase = {
  from: jest.fn(),
}

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/complete-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
})

describe('POST /api/auth/complete-signup', () => {
  function mockFreshUser() {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({ limit: () => Promise.resolve({ data: [] }) }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'new-user-id' }, error: null }),
        }),
      }),
    }))
  }

  it('creates user, calls Brevo, sets cookie, returns 200', async () => {
    mockFreshUser()

    const res = await POST(makeReq({ email: 'new@example.com', name: 'Alice' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true })
    expect(addContact).toHaveBeenCalledWith('Alice', 'new@example.com')
    expect(sendWelcomeEmail).toHaveBeenCalledWith('Alice', 'new@example.com')
    expect(res.headers.get('Set-Cookie')).toMatch(/defilords_session=/)
  })

  it('returns 400 for duplicate email', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({ limit: () => Promise.resolve({ data: [{ id: 'existing' }] }) }),
      }),
    }))

    const res = await POST(makeReq({ email: 'existing@example.com', name: 'Bob' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Already registered')
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeReq({ email: 'new@example.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is too short', async () => {
    const res = await POST(makeReq({ email: 'new@example.com', name: 'A' }))
    expect(res.status).toBe(400)
  })
})
