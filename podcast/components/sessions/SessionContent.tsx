import Link from 'next/link'
import { SESSIONS } from '@/constants/sessions'

// Placeholder external links for session 3 — finalised in chunk 9
// (GitHub repo URL + AI Vaults deposit page URL).
const GITHUB_URL = 'https://github.com/defilords'
const AI_VAULTS_URL = 'https://defilords.com/ai-vaults'

interface SessionContentProps {
  sessionId: number
}

/**
 * Displays the unlocked content for a paid (or free) session. Access is already
 * verified server-side by the page before this renders — this component only
 * shows content, it never gates it.
 */
export function SessionContent({ sessionId }: SessionContentProps) {
  const session = SESSIONS.find((s) => s.id === sessionId)
  if (!session) return null

  const isFree = session.isFree

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <span className="text-brand-amber text-xs font-mono font-semibold tracking-widest uppercase">
        Session {session.id}
      </span>

      <h1 className="text-brand-heading text-3xl sm:text-4xl font-bold leading-tight tracking-tight mt-3 mb-4">
        {session.title}
      </h1>
      <p className="text-brand-body text-lg leading-relaxed mb-10">{session.description}</p>

      {/* Primary action — the Twitter/X link. Opens in a new tab so the user
          doesn't lose their place on the site. */}
      <Link
        href={session.twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand-amber text-brand-bg font-semibold text-lg hover:bg-brand-amberDark transition-colors"
      >
        Watch on Twitter →
      </Link>

      {/* Session 1 (free) — gentle upsell back to the paid sessions. */}
      {isFree && (
        <p className="mt-8 text-brand-body text-sm">
          Enjoying this?{' '}
          <Link
            href="/#sessions"
            className="text-brand-amber font-semibold hover:text-brand-amberDark transition-colors"
          >
            Unlock Session 2 →
          </Link>
        </p>
      )}

      {/* Session 3 — extra calls to action for developers / investors. */}
      {session.id === 3 && (
        <div className="mt-12 pt-8 border-t border-brand-border">
          <h2 className="text-brand-heading font-semibold text-lg mb-4">Go further</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 min-h-[48px] items-center justify-center text-center px-5 py-3 rounded-lg border border-brand-border bg-brand-surface text-brand-heading font-medium text-sm hover:border-brand-amberDark transition-colors"
            >
              Contribute on GitHub →
            </Link>
            <Link
              href={AI_VAULTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 min-h-[48px] items-center justify-center text-center px-5 py-3 rounded-lg border border-brand-greenBorder bg-brand-greenDeep text-brand-green font-medium text-sm hover:opacity-80 transition-opacity"
            >
              Invest in AI Vaults →
            </Link>
          </div>
        </div>
      )}

      {/* Reassurance for paid sessions — access is permanent. */}
      {!isFree && (
        <p className="mt-10 text-brand-green text-xs font-medium flex items-center gap-1.5">
          <span aria-hidden="true">✓</span> You have lifetime access
        </p>
      )}

      <div className="mt-12">
        <Link
          href="/"
          className="text-brand-muted hover:text-brand-body text-sm transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
