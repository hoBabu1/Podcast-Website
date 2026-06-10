import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getPayments } from '@/lib/admin/queries'
import { PaymentTable } from '@/components/admin/PaymentTable'

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await getServerSession()
  if (!session || session.role !== 'owner') redirect('/')

  const page = Math.max(1, Number(searchParams.page) || 1)
  const { payments, total } = await getPayments(page)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-brand-heading text-2xl font-bold tracking-tight">Payment History</h1>
        <Link
          href="/admin"
          className="text-brand-body hover:text-brand-heading text-sm transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>

      <PaymentTable payments={payments} total={total} page={page} />
    </div>
  )
}
