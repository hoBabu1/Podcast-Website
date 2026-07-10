import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getStats, getSessionBreakdown } from '@/lib/admin/queries'
import { AdminStatsCard } from '@/components/admin/AdminStatsCard'
import { SessionBreakdown } from '@/components/admin/SessionBreakdown'

export default async function AdminPage() {
  const session = await getServerSession()
  if (!session || session.role !== 'owner') redirect('/')

  const [stats, breakdown] = await Promise.all([getStats(), getSessionBreakdown()])

  return (
    <div className="space-y-8">
      <h1 className="text-brand-heading text-3xl font-bold tracking-tight">Owner Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard label="Users" value={stats.totalUsers} />
        <AdminStatsCard label="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} />
        <AdminStatsCard label="S2 Sales" value={stats.session2Count} />
        <AdminStatsCard label="S3 Sales" value={stats.session3Count} />
      </div>

      <SessionBreakdown breakdown={breakdown} />

      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/users"
          className="rounded bg-brand-amber px-5 py-2.5 text-sm font-semibold text-brand-bg hover:bg-brand-amberDark transition-colors"
        >
          View Users →
        </Link>
        <Link
          href="/admin/payments"
          className="rounded border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-heading hover:border-brand-amber transition-colors"
        >
          View Payments →
        </Link>
        <Link
          href="/admin/rewards"
          className="rounded border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-heading hover:border-brand-amber transition-colors"
        >
          Rewards Tracker →
        </Link>
      </div>
    </div>
  )
}
