import Link from 'next/link'

/**
 * Shared prev/next pager for the admin tables. Rendered server-side; preserves
 * any extra query params (e.g. `search`) while changing only the page number.
 */
export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string
  page: number
  totalPages: number
  params?: Record<string, string>
}) {
  const href = (target: number) => {
    const sp = new URLSearchParams(params)
    sp.set('page', String(target))
    return `${basePath}?${sp.toString()}`
  }

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages
  const linkClass =
    'px-3 py-1.5 rounded border border-brand-border text-brand-heading text-sm hover:border-brand-amber transition-colors'
  const disabledClass =
    'px-3 py-1.5 rounded border border-brand-border text-brand-muted text-sm cursor-not-allowed'

  return (
    <div className="flex items-center justify-between mt-4">
      {prevDisabled ? (
        <span className={disabledClass}>← Prev</span>
      ) : (
        <Link href={href(page - 1)} className={linkClass}>
          ← Prev
        </Link>
      )}

      <span className="text-brand-muted text-sm">
        Page {page} of {totalPages}
      </span>

      {nextDisabled ? (
        <span className={disabledClass}>Next →</span>
      ) : (
        <Link href={href(page + 1)} className={linkClass}>
          Next →
        </Link>
      )}
    </div>
  )
}
