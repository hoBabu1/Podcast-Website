'use client'
import Link from 'next/link'
import { SESSIONS } from '@/constants/sessions'
import { useAuth } from '@/hooks/useAuth'
import { VideoPlayer } from './VideoPlayer'

// Placeholder external links for session 3 — finalised in chunk 9
// (GitHub repo URL + AI Vaults deposit page URL).
const GITHUB_URL = 'https://github.com/defilords'
const AI_VAULTS_URL = 'https://defilords.com/ai-vaults'

// Structured learning content shown after payment for the paid sessions.
// Section headings render in amber, bullets in body text, sections spaced gap-6.
const SESSION_LEARNINGS: Record<
  number,
  { sections: { heading: string; bullets: string[] }[]; outcome?: string }
> = {
  2: {
    sections: [
      {
        heading: 'What you will learn:',
        bullets: [
          'Liquidity pools — how they work and how to profit safely',
          'Staking strategies that compound automatically',
          'Pendle Finance — the yield trading protocol most investors miss',
          'Low-risk stable yield strategies for beginners',
          'Real portfolio examples with live numbers',
          'How DefiLords vets every protocol before recommending it',
        ],
      },
    ],
  },
  3: {
    sections: [
      {
        heading: 'Part 1 — Borrow Without Selling:',
        bullets: [
          'Use Aave to borrow USDC against your ETH — keep exposure, unlock liquidity',
          'Morpho — peer-to-peer lending for better rates',
          'Kamino — capital-efficient borrowing on Solana',
        ],
      },
      {
        heading: 'Part 2 — Stack Yield on Yield:',
        bullets: [
          'Deposit ETH → borrow USDC → deploy into DefiLords AI Vaults',
          'Recursive yield generation explained simply',
          'Health factors, liquidation avoidance, risk management',
        ],
      },
      {
        heading: 'Part 3 — DefiLords AI Alpha Hunter:',
        bullets: [
          'Live demo of the autonomous on-chain trading agent',
          'AI scoring engine: Momentum (35%), Volume (20%), Trend (20%), Risk (25%)',
          'Fear & Greed analysis, regime detection, portfolio allocation',
          '24-token universe with real-time AI scoring',
          'How to read the dashboard — token scoring, trade history, portfolio metrics',
          'Future roadmap: live autonomous execution, multi-chain, vault integration',
        ],
      },
    ],
    outcome:
      'You leave this session knowing how to deploy capital intelligently, stack yield efficiently, and let DefiLords AI do the heavy lifting.',
  },
}

interface SessionContentProps {
  sessionId: number
}

/**
 * Displays the unlocked content for a paid (or free) session. Access is already
 * verified server-side by the page before this renders — this component only
 * shows content, it never gates it.
 */
export function SessionContent({ sessionId }: SessionContentProps) {
  const { user } = useAuth()
  const session = SESSIONS.find((s) => s.id === sessionId)
  if (!session) return null

  const isFree = session.isFree
  const learnings = SESSION_LEARNINGS[session.id]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      {/* Embedded video — full width, 16:9 */}
      <div className="mb-8 sm:mb-10">
        <VideoPlayer sessionId={sessionId} userEmail={user?.email ?? ''} />
      </div>

      <span className="text-brand-amber text-xs font-mono font-semibold tracking-widest uppercase">
        Session {session.id}
      </span>

      <h1 className="text-brand-heading text-xl sm:text-2xl font-bold leading-tight tracking-tight mt-3 mb-4">
        {session.title}
      </h1>
      <p className="text-brand-body text-lg leading-relaxed mb-8 sm:mb-10">{session.description}</p>

      {/* Structured learning content for paid sessions — shown after payment. */}
      {learnings && (
        <div className="flex flex-col gap-6 mb-8 sm:mb-10">
          {learnings.sections.map((section) => (
            <div key={section.heading} className="flex flex-col gap-3">
              <h2 className="text-brand-amber font-medium text-base sm:text-lg">
                {section.heading}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="text-brand-body text-sm">
                    • {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {learnings.outcome && (
            <div className="flex flex-col gap-3">
              <h2 className="text-brand-amber font-medium text-base sm:text-lg">Final outcome:</h2>
              <p className="text-brand-body text-sm leading-relaxed">{learnings.outcome}</p>
            </div>
          )}
        </div>
      )}

      {/* Primary action — the Twitter/X link. Opens in a new tab so the user
          doesn't lose their place on the site. */}
      <Link
        href={session.twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 min-h-[48px] rounded-xl bg-brand-amber text-brand-bg font-semibold text-lg hover:bg-brand-amberDark transition-colors"
      >
        Discuss on Twitter →
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
