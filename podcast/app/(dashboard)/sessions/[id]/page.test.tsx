import type { ReactElement } from 'react'

// redirect() returns `never` in real Next.js (it throws to halt rendering).
// We mimic that here so control flow stops exactly like it does in production.
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

jest.mock('@/lib/auth/serverAuth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/sessions/access', () => ({
  hasSessionAccess: jest.fn(),
}))

import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/serverAuth'
import { hasSessionAccess } from '@/lib/sessions/access'
import { SessionContent } from '@/components/sessions/SessionContent'
import SessionPage from './page'

function mockSession() {
  ;(getServerSession as jest.Mock).mockResolvedValue({
    email: 'user@example.com',
    userId: 'user-123',
    role: null,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SessionPage access gate', () => {
  it('redirects to /login when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    await expect(SessionPage({ params: { id: '2' } })).rejects.toThrow('REDIRECT:/login')
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('redirects home with ?locked when authenticated but without access', async () => {
    mockSession()
    ;(hasSessionAccess as jest.Mock).mockResolvedValue(false)
    await expect(SessionPage({ params: { id: '2' } })).rejects.toThrow('REDIRECT:/?locked=2')
    expect(redirect).toHaveBeenCalledWith('/?locked=2')
  })

  it('renders the session content when the user has access', async () => {
    mockSession()
    ;(hasSessionAccess as jest.Mock).mockResolvedValue(true)
    const result = (await SessionPage({ params: { id: '2' } })) as ReactElement
    expect(redirect).not.toHaveBeenCalled()
    expect(result.type).toBe(SessionContent)
    expect(result.props.sessionId).toBe(2)
  })

  it('redirects home for an unknown session id', async () => {
    mockSession()
    await expect(SessionPage({ params: { id: '99' } })).rejects.toThrow('REDIRECT:/')
    expect(hasSessionAccess).not.toHaveBeenCalled()
  })
})
