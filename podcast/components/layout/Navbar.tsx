import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, getSession } from '@/lib/auth/session'
import { UserMenu } from './UserMenu'
import { MobileNav } from './MobileNav'
import { WalletButton } from '@/components/wallet/WalletButton'

export async function Navbar() {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? ''
  const req = new Request('http://localhost', {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  })
  const session = await getSession(req)

  return (
    <nav className="w-full border-b border-brand-border bg-brand-bg sticky top-0 z-50 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand logo + wordmark — links home. Logo lives in /public/logo.png
            (transparent PNG, sized to the 32px navbar). `priority` loads it
            eagerly since it's above the fold on every page. */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="DefiLords"
            width={32}
            height={32}
            priority
            className="h-8 w-8 flex-shrink-0"
          />
          <span className="text-brand-heading font-semibold text-lg tracking-tight">DefiLords</span>
        </Link>

        {/* Desktop / tablet — inline cluster */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="#sessions"
            className="text-brand-body hover:text-brand-heading text-base transition-colors"
          >
            Sessions
          </Link>
          <Link
            href="https://aivaults.defilords.finance/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-body hover:text-brand-heading text-base transition-colors"
          >
            AI Vaults
          </Link>
          <Link
            href="/rewards"
            className="text-brand-body hover:text-brand-heading text-base transition-colors"
          >
            Rewards
          </Link>

          <WalletButton />

          {session ? (
            <>
              {session.role === 'owner' && (
                <Link
                  href="/admin"
                  className="text-brand-amber hover:text-brand-amberDark text-base font-semibold transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <UserMenu name={session.name} email={session.email} />
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded bg-brand-amber text-brand-bg text-base font-semibold hover:bg-brand-amberDark transition-colors"
            >
              Get started
            </Link>
          )}
        </div>

        {/* Mobile — hamburger + full-width dropdown */}
        <MobileNav
          isLoggedIn={!!session}
          isOwner={session?.role === 'owner'}
          name={session?.name ?? ''}
          email={session?.email ?? ''}
        />
      </div>
    </nav>
  )
}
