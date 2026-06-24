import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SessionCard } from '@/components/sessions/SessionCard'
import { DevSection } from '@/components/layout/DevSection'
import { LockedScroller } from '@/components/sessions/LockedScroller'
import { SESSIONS } from '@/constants/sessions'

export default function HomePage({
  searchParams,
}: {
  searchParams: { locked?: string }
}) {
  // Set when the user was redirected here after trying to open a session they
  // haven't paid for. Only 2 & 3 are paid, so anything else is ignored.
  const lockedId =
    searchParams.locked === '2' || searchParams.locked === '3'
      ? Number(searchParams.locked)
      : null

  return (
    <div className="min-h-screen flex flex-col">
      {lockedId && <LockedScroller targetId="sessions" />}
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <p className="text-brand-amber text-sm font-semibold tracking-widest uppercase mb-4">
            Web3 learning platform
          </p>
          <h1 className="text-brand-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight max-w-2xl mx-auto mb-6 break-words text-balance">
            Learn DeFi. <span className="text-brand-amber">Earn Yield.</span> Build Wealth On-Chain.
          </h1>
          <p className="text-brand-body text-base sm:text-lg max-w-xl mx-auto mb-10 break-words text-balance">
            Three live sessions. From complete beginner to confident DeFi investor. Register free — we'll send you the link before each session.
          </p>
          <Link
            href="#sessions"
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3 min-h-[48px] rounded-lg bg-brand-amber text-brand-bg font-semibold text-base hover:bg-brand-amberDark transition-colors"
          >
            Register Free — Get the Session Link
          </Link>
        </section>

        {/* Session cards */}
        <section id="sessions" className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
          <h2 className="text-brand-heading text-2xl font-bold mb-8">Sessions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SESSIONS.map((session, index) => (
              <SessionCard
                key={session.id}
                session={session}
                index={index}
                isLocked={lockedId === session.id}
              />
            ))}
          </div>
        </section>

        <DevSection />
      </main>

      <Footer />
    </div>
  )
}
