import { POST } from './route'

describe('POST /api/auth/sign-out', () => {
  it('returns 200 with { success: true }', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true })
  })

  it('clears the session cookie', async () => {
    const res = await POST()
    const cookie = res.headers.get('Set-Cookie')
    expect(cookie).toMatch(/defilords_session=;/)
    expect(cookie).toMatch(/Max-Age=0/)
  })
})
