import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RewardPositionCard } from '@/components/rewards/RewardPositionCard'
import { HowRewardsWork } from '@/components/rewards/HowRewardsWork'
import { getRewardPositions } from '@/lib/rewards/queries'

export default async function RewardsPage() {
  const positions = await getRewardPositions()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center">
          <p className="text-brand-amber text-sm font-semibold tracking-widest uppercase mb-4">
            Rewards Tracker
          </p>
          <h1 className="text-brand-heading text-3xl sm:text-4xl font-bold leading-tight tracking-tight max-w-2xl mx-auto mb-6 text-balance">
            Live and completed sponsored vault positions
          </h1>
          <p className="text-brand-body text-base max-w-xl mx-auto mb-4 text-balance">
            After each Academy session, DefiLords selects one winner at random and funds a live
            vault position on their behalf. The winner receives the yield generated over 14 days —
            the sponsored capital itself always remains funded by DefiLords.
          </p>
          <Link
            href="/#sessions"
            className="text-brand-amber text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            ← Back to sessions
          </Link>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
          {positions.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-16">
              No reward positions have been posted yet. Check back after the next session.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {positions.map((position) => (
                <RewardPositionCard key={position.id} position={position} />
              ))}
            </div>
          )}
        </section>

        <HowRewardsWork />
      </main>

      <Footer />
    </div>
  )
}
