import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/serverAuth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session || session.role !== 'owner') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-brand-surface">
      <nav className="w-full border-b border-brand-border bg-brand-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-brand-amberDark flex-shrink-0" aria-hidden="true" />
            <span className="text-brand-heading font-semibold text-lg tracking-tight">
              DefiLords Admin
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-brand-muted text-sm hidden sm:block">{session.email}</span>
            <Link
              href="/"
              className="text-brand-body hover:text-brand-heading text-sm transition-colors"
            >
              Back to site
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
