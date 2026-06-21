'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAuth } from '@/hooks/useAuth'
import { useSessionAccess } from '@/hooks/useSessionAccess'
import { SESSIONS } from '@/constants/sessions'
import { PaymentModal } from './PaymentModal'
import { Skeleton } from '@/components/ui/Skeleton'

// Shared across every session — the core DefiLords recursive yield strategy.
// Reused below so the same block stays in sync everywhere it appears.
const RECURSIVE_YIELD_SECTION = {
  heading: 'The DefiLords Recursive Yield Strategy:',
  bullets: [
    'Deposit ETH → borrow USDC → deploy into DefiLords AI Vaults',
    'Recursive yield generation explained simply',
    'Health factors, liquidation avoidance, risk management',
  ],
}

// Full curriculum shown inside the modal, keyed by session id. Content only —
// section headings render in amber, bullets in body text.
const CURRICULUM: Record<1 | 2 | 3, { heading: string; bullets: string[] }[]> = {
  1: [RECURSIVE_YIELD_SECTION],
  2: [
    {
      heading: 'What you will learn:',
      bullets: [
        'How to earn yield on stablecoins safely',
        'Liquidity pools — how they work and how to profit',
        'Staking strategies that compound automatically',
        'Real portfolio examples with live numbers',
        'How DefiLords vets every protocol before recommending it',
      ],
    },
    RECURSIVE_YIELD_SECTION,
  ],
  3: [
    {
      heading: 'Part 1 — Borrow Without Selling:',
      bullets: [
        'Use Aave to borrow USDC against your ETH',
        'Morpho — peer-to-peer lending for better rates',
        'Kamino — capital-efficient borrowing on Solana',
      ],
    },
    RECURSIVE_YIELD_SECTION,
    {
      heading: 'Part 2 — DefiLords AI Alpha Hunter:',
      bullets: [
        'Live demo of autonomous on-chain trading agent',
        'AI scoring: Momentum (35%), Volume (20%), Trend (20%), Risk (25%)',
        'Fear & Greed analysis, regime detection, portfolio allocation',
        '24-token universe with real-time AI scoring',
        'How to read the dashboard — token scoring, trade history, metrics',
        'Future: live autonomous execution, multi-chain, vault integration',
      ],
    },
  ],
}

interface CurriculumModalProps {
  sessionId: 1 | 2 | 3
  isOpen: boolean
  onClose: () => void
}

export function CurriculumModal({ sessionId, isOpen, onClose }: CurriculumModalProps) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { user, isLoading: authLoading } = useAuth()
  const { hasAccess } = useSessionAccess(sessionId)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const isLoggedIn = !!user
  const session = SESSIONS.find((s) => s.id === sessionId)
  const sections = CURRICULUM[sessionId]

  // Close on Escape key.
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !session) return null

  // Bottom CTA — mirrors the card's pay logic so we reuse the existing payment
  // flow rather than rewriting it.
  function renderUnlock() {
    if (session?.isFree) {
      return (
        <Link
          href={`/sessions/${sessionId}`}
          className="flex w-full min-h-[48px] items-center justify-center rounded-lg text-sm font-semibold text-center bg-brand-green text-brand-bg hover:opacity-90 transition-opacity"
        >
          Get Access →
        </Link>
      )
    }

    if (authLoading) {
      return <Skeleton className="h-12 w-full" />
    }

    if (hasAccess) {
      return (
        <Link
          href={`/sessions/${sessionId}`}
          className="flex w-full min-h-[48px] items-center justify-center rounded-lg text-sm font-semibold text-center bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors"
        >
          View Session →
        </Link>
      )
    }

    if (!isLoggedIn) {
      return (
        <Link
          href="/login"
          className="flex w-full min-h-[48px] items-center justify-center rounded-lg text-sm font-semibold text-center bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors"
        >
          Unlock Session →
        </Link>
      )
    }

    if (!isConnected) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-brand-muted text-xs text-center">Connect wallet to pay</p>
          <button
            onClick={() => openConnectModal?.()}
            className="w-full min-h-[48px] rounded-lg text-sm font-semibold bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => setPaymentModalOpen(true)}
        className="w-full min-h-[48px] rounded-lg text-sm font-semibold bg-brand-amber text-black hover:bg-brand-amberDark transition-colors cursor-pointer"
      >
        Unlock Session →
      </button>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-brand-surface border border-brand-border rounded-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-brand-muted hover:text-brand-heading transition-colors text-xl leading-none"
          >
            ×
          </button>

          <h2 className="text-brand-heading font-bold text-lg pr-8">
            Session {sessionId} Curriculum
          </h2>
          <div className="mt-3 h-px bg-brand-border" />

          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-brand-amber font-medium text-sm mt-4 mb-2">{section.heading}</h3>
              <ul className="flex flex-col gap-1.5">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="text-brand-body text-sm leading-relaxed">
                    • {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-6">{renderUnlock()}</div>
        </div>
      </div>

      {sessionId !== 1 && (
        <PaymentModal
          sessionId={sessionId as 2 | 3}
          sessionPrice={session.price}
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            setPaymentModalOpen(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
