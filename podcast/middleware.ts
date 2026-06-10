import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const isSessionRoute = pathname.startsWith('/sessions')
  const isAdminRoute = pathname.startsWith('/admin')

  if (!isSessionRoute && !isAdminRoute) {
    return NextResponse.next()
  }

  const session = await getSession(req)

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute && session.role !== 'owner') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/sessions/:path*', '/admin/:path*'],
}
