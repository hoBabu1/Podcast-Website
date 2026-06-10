'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAuth } from '@/hooks/useAuth'
import { useWalletPayment } from '@/hooks/useWalletPayment'
import { useSessionAccess } from '@/hooks/useSessionAccess'
import { PaymentProgress } from './PaymentProgress'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Session } from '@/constants/sessions'

interface SessionCardProps {
  session: Session
  index: number
  /** Set when the user was redirected here after trying to open a locked session. */
  isLocked?: boolean
}

export function SessionCard({ session, index, isLocked = false }: SessionCardProps) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { user, isLoading: authLoading } = useAuth()
  const { pay, retryVerification, canRetryVerification, status, error, isPaying } =
    useWalletPayment()
  const { hasAccess } = useSessionAccess(session.id)

  const isLoggedIn = !!user

  // Briefly pulse an amber border when this card is the one the user was locked
  // out of, then settle back to the normal border.
  const [highlight, setHighlight] = useState(isLocked)
  useEffect(() => {
    if (!isLocked) return
    setHighlight(true)
    const timer = setTimeout(() => setHighlight(false), 4000)
    return () => clearTimeout(timer)
  }, [isLocked])

  if (session.isFree) {
    return (
      <div className="rounded-xl border border-brand-greenBorder bg-[#0e1812] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brand-muted text-xs font-mono">Session {index + 1}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-greenDeep border border-brand-greenBorder text-brand-green">
            Free
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-brand-heading font-semibold text-lg leading-snug">{session.title}</h3>
          <p className="text-brand-body text-sm">{session.description}</p>
        </div>
        <Link
          href={`/sessions/${session.id}`}
          className="mt-auto inline-flex items-center gap-1 text-brand-green font-semibold text-sm hover:opacity-80 transition-opacity"
        >
          Watch now →
        </Link>
      </div>
    )
  }

  const sessionId = session.id as 2 | 3

  function renderAction() {
    if (isPaying) {
      return <PaymentProgress status={status} />
    }

    // Auth/access still resolving on the client — show a button-sized skeleton
    // instead of briefly flashing the wrong action (e.g. "Get started").
    if (authLoading) {
      return <Skeleton className="h-10 w-full" />
    }

    if (hasAccess) {
      return (
        <div className="flex flex-col gap-2 items-stretch">
          <span className="self-center text-xs font-semibold px-3 py-1 rounded-full bg-brand-greenDeep border border-brand-greenBorder text-brand-green">
            ✓ Access granted
          </span>
          <Link
            href={`/sessions/${session.id}`}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-center bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors"
          >
            View Session →
          </Link>
        </div>
      )
    }

    if (!authLoading && !isLoggedIn) {
      return (
        <Link
          href="/login"
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-center bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors"
        >
          Get started to unlock
        </Link>
      )
    }

    if (isLoggedIn && !isConnected) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-brand-muted text-xs text-center">Connect your wallet to pay</p>
          <button
            onClick={openConnectModal}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      )
    }

    return (
      <button
        disabled={authLoading}
        onClick={() => pay(sessionId)}
        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        Pay ${session.price} USDC
      </button>
    )
  }

  return (
    <div
      className={`rounded-xl border bg-brand-surface p-6 flex flex-col gap-4 transition-all duration-500 ${
        hasAccess
          ? 'border-brand-greenBorder shadow-[0_0_22px_-6px_rgba(151,196,89,0.45)]'
          : highlight
            ? 'border-brand-amber ring-2 ring-brand-amber'
            : 'border-brand-border'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-brand-muted text-xs font-mono">Session {index + 1}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-amberDeep border border-brand-amberDark text-brand-amber">
          ${session.price} USDC
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <LockIcon className="mt-1 flex-shrink-0 text-brand-muted" />
          <h3 className="text-brand-heading font-semibold text-lg leading-snug">{session.title}</h3>
        </div>
        <p className="text-brand-body text-sm">{session.description}</p>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {isLocked && !hasAccess && (
          <p className="text-brand-amber text-xs text-center">
            You need to pay to access this session
          </p>
        )}
        {renderAction()}
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        {canRetryVerification && !isPaying && !hasAccess && (
          <button
            onClick={retryVerification}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand-amber text-brand-bg hover:bg-brand-amberDark transition-colors cursor-pointer"
          >
            Payment sent — retry unlock
          </button>
        )}
      </div>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 ${className ?? ''}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
        clipRule="evenodd"
      />
    </svg>
  )
}
