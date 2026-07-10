import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getRewardPositions } from '@/lib/rewards/queries'
import { RewardsAdminTable } from '@/components/admin/RewardsAdminTable'

export default async function AdminRewardsPage() {
  const session = await getServerSession()
  if (!session || session.role !== 'owner') redirect('/')

  const positions = await getRewardPositions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-brand-heading text-2xl font-bold tracking-tight">Rewards Tracker</h1>
        <Link
          href="/admin"
          className="text-brand-body hover:text-brand-heading text-sm transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>

      <RewardsAdminTable initialPositions={positions} />
    </div>
  )
}
