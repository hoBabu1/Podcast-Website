import { ADMIN_PAGE_SIZE } from '@/lib/admin/queries'
import type { AdminUser } from '@/types/admin'
import { WalletPill } from './WalletPill'
import { Pagination } from './Pagination'

export function UserTable({
  users,
  total,
  page,
  search,
}: {
  users: AdminUser[]
  total: number
  page: number
  search: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))

  return (
    <div>
      <form method="get" action="/admin/users" className="mb-5 flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by name or email"
          className="flex-1 rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading placeholder:text-brand-muted focus:border-brand-amber focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-bg hover:bg-brand-amberDark transition-colors"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-bg text-brand-body">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Wallet addresses</th>
              <th className="px-4 py-3 font-medium">Signed up</th>
              <th className="px-4 py-3 font-medium">Sessions unlocked</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-brand-border">
                  <td className="px-4 py-3 text-brand-heading">{user.name}</td>
                  <td className="px-4 py-3 text-brand-body">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.wallet_addresses.length === 0 ? (
                      <span className="text-brand-muted">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.wallet_addresses.map((address) => (
                          <WalletPill key={address} address={address} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-body whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.sessions_unlocked.map((id) => (
                        <span
                          key={id}
                          className="rounded border border-brand-greenBorder bg-brand-greenDeep px-1.5 py-0.5 text-xs font-semibold text-brand-green"
                        >
                          S{id}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/admin/users"
        page={page}
        totalPages={totalPages}
        params={search ? { search } : {}}
      />
    </div>
  )
}
