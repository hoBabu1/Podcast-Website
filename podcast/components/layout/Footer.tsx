import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-bg mt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-brand-muted text-sm">© 2025 DefiLords. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link
            href="https://twitter.com/defilords"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-muted hover:text-brand-amber text-sm transition-colors"
          >
            Twitter / X
          </Link>
          <Link
            href="https://github.com/defilords"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-muted hover:text-brand-amber text-sm transition-colors"
          >
            GitHub
          </Link>
          <Link
            href="#invest"
            className="text-brand-muted hover:text-brand-amber text-sm transition-colors"
          >
            Invest
          </Link>
        </div>
      </div>
    </footer>
  )
}
