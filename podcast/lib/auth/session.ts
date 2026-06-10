export const SESSION_COOKIE = 'defilords_session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

interface SessionPayload {
  email: string
  userId: string
  role: 'owner' | null
  exp: number
}

function toBase64url(bytes: Uint8Array): string {
  let str = ''
  for (const byte of bytes) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(b64: string): Uint8Array<ArrayBuffer> {
  const base64 = b64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSession(
  email: string,
  userId: string,
  role: 'owner' | null = null
): Promise<string> {
  const secret = process.env.SESSION_SECRET!
  const payload: SessionPayload = {
    email,
    userId,
    role,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  }
  const data = toBase64url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await importKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${toBase64url(new Uint8Array(sig))}`
}

export async function getSession(
  req: Request
): Promise<{ email: string; userId: string; role: 'owner' | null } | null> {
  const secret = process.env.SESSION_SECRET
  if (!secret) return null

  const cookieHeader = req.headers.get('cookie') ?? ''
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  if (!match) return null

  const token = match.slice(SESSION_COOKIE.length + 1)
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return null

  const data = token.slice(0, dotIndex)
  const sig = token.slice(dotIndex + 1)

  try {
    const key = await importKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64url(sig),
      new TextEncoder().encode(data)
    )
    if (!valid) return null

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64url(data))
    ) as SessionPayload

    if (payload.exp < Date.now()) return null

    return { email: payload.email, userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

export function makeSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}
