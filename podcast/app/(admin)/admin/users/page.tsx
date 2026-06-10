import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getUsers } from '@/lib/admin/queries'
import { UserTable } from '@/components/admin/UserTable'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string }
}) {
  const session = await getServerSession()
  if (!session || session.role !== 'owner') redirect('/')

  const page = Math.max(1, Number(searchParams.page) || 1)
  const search = (searchParams.search ?? '').trim()

  const { users, total } = await getUsers(page, search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-brand-heading text-2xl font-bold tracking-tight">Users</h1>
        <Link
          href="/admin"
          className="text-brand-body hover:text-brand-heading text-sm transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>

      <UserTable users={users} total={total} page={page} search={search} />
    </div>
  )
}
