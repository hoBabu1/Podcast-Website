import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

const isDev = process.env.NODE_ENV === 'development'

// CSP is built per-request so each response carries a unique script nonce.
// Next.js reads the nonce from the request's CSP header and stamps it onto
// the inline bootstrap/hydration scripts it injects. `strict-dynamic` then
// trusts the chunk scripts those nonced scripts load.
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    // wagmi/RainbowKit/WalletConnect need to reach RPC + relay endpoints
    "connect-src 'self' https: wss:",
    // WalletConnect's verify iframe + RainbowKit modal assets + YouTube embeds
    "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  const nonce = btoa(crypto.randomUUID())
  const csp = buildCsp(nonce)

  // Pass the nonce + CSP down on the *request* so Next.js can apply the nonce
  // to its own scripts (and so server components can read `x-nonce` if needed).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  // Auth gating — only for protected page routes.
  const isSessionRoute = pathname.startsWith('/sessions')
  const isAdminRoute = pathname.startsWith('/admin')

  if (isSessionRoute || isAdminRoute) {
    const session = await getSession(req)

    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }

    if (isAdminRoute && session.role !== 'owner') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export const config = {
  // Run on every route except API routes and static assets, and skip prefetches
  // so prefetched pages don't get cached with a stale nonce.
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
