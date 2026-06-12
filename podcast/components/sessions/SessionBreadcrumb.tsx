'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Breadcrumb for session pages: DefiLords → Sessions → Session N.
 * The session layout sits above the [id] segment so it can't read the id from
 * params — we derive it from the pathname instead.
 */
export function SessionBreadcrumb() {
  const pathname = usePathname()
  const match = pathname.match(/^\/sessions\/(\d+)/)
  const sessionId = match ? match[1] : null

  const sep = <span className="text-brand-muted">→</span>

  return (
    <nav
      aria-label="Breadcrumb"
      className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 flex flex-wrap items-center gap-2 text-sm"
    >
      <Link href="/" className="text-brand-body hover:text-brand-amber transition-colors">
        DefiLords
      </Link>
      {sep}
      <Link href="/#sessions" className="text-brand-body hover:text-brand-amber transition-colors">
        Sessions
      </Link>
      {sessionId && (
        <>
          {sep}
          <Link
            href={`/sessions/${sessionId}`}
            className="text-brand-amber font-medium"
            aria-current="page"
          >
            Session {sessionId}
          </Link>
        </>
      )}
    </nav>
  )
}
