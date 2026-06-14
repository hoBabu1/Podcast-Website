import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-bg mt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-brand-muted text-sm">© 2026 DefiLords</p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="https://x.com/defilordsss?s=21"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-muted hover:text-brand-amber text-sm transition-colors"
          >
            𝕏
          </Link>
          <Link
            href="https://t.me/defilordss"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-muted hover:text-brand-amber text-sm transition-colors"
          >
            Telegram
          </Link>
          <Link
            href="https://discord.gg/2GHZ4F93tb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-muted hover:text-brand-amber text-sm transition-colors"
          >
            Discord
          </Link>
        </div>
      </div>
    </footer>
  )
}
