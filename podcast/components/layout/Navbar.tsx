import Link from 'next/link'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, getSession } from '@/lib/auth/session'
import { SignOutButton } from './SignOutButton'
import { WalletButton } from '@/components/wallet/WalletButton'

export async function Navbar() {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? ''
  const req = new Request('http://localhost', {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  })
  const session = await getSession(req)

  return (
    <nav className="w-full border-b border-brand-border bg-brand-bg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-brand-amberDark flex-shrink-0" aria-hidden="true" />
          <span className="text-brand-heading font-semibold text-lg tracking-tight">DefiLords</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="#sessions"
            className="text-brand-body hover:text-brand-heading text-sm transition-colors hidden sm:block"
          >
            Sessions
          </Link>
          <Link
            href="#invest"
            className="text-brand-body hover:text-brand-heading text-sm transition-colors hidden sm:block"
          >
            Invest
          </Link>

          <WalletButton />

          {session ? (
            <>
              {session.role === 'owner' && (
                <Link
                  href="/admin"
                  className="text-brand-amber hover:text-brand-amberDark text-sm font-semibold transition-colors hidden sm:block"
                >
                  Dashboard
                </Link>
              )}
              <span className="text-brand-muted text-sm hidden sm:block">{session.email}</span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded bg-brand-amber text-brand-bg text-sm font-semibold hover:bg-brand-amberDark transition-colors"
            >
              Get started
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
