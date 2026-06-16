'use client'

import { useState, useEffect } from 'react'
import { TokenSelector } from './TokenSelector'
import { PaymentProgress } from './PaymentProgress'
import { useWalletPayment } from '@/hooks/useWalletPayment'
import type { SupportedToken } from '@/lib/web3/contracts'

interface PaymentModalProps {
  sessionId: 2 | 3
  sessionPrice: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({
  sessionId,
  sessionPrice,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('USDC')
  const { pay, retryVerification, canRetryVerification, status, error, isPaying } =
    useWalletPayment()

  const paymentAddress = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS ?? ''
  const shortAddress = paymentAddress
    ? `${paymentAddress.slice(0, 6)}...${paymentAddress.slice(-6)}`
    : '—'

  // Auto-close 2 seconds after success
  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => {
      onSuccess()
    }, 2000)
    return () => clearTimeout(timer)
  }, [status, onSuccess])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function renderBody() {
    if (isPaying || status === 'success') {
      return <PaymentProgress status={status} />
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <p className="text-brand-body text-sm">Select payment token:</p>
          <TokenSelector
            selectedToken={selectedToken}
            onChange={setSelectedToken}
            sessionPrice={sessionPrice}
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-brand-muted text-xs">You will pay:</p>
          <p className="text-brand-heading font-semibold">
            {sessionPrice} {selectedToken}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-brand-muted text-xs">To wallet:</p>
          <p className="font-mono text-xs text-brand-body">{shortAddress}</p>
        </div>

        {/*
          Network warning: payments are only verified on-chain on Base mainnet
          (see /api/payment/verify). Funds sent on any other network won't be
          detected and the session stays locked — make that explicit up front.
        */}
        <div className="rounded-lg border border-brand-amber/40 bg-brand-amber/10 px-3 py-2">
          <p className="text-brand-amber text-xs font-medium">
            Pay on Base mainnet only. Sending on any other network will not unlock the session.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="flex flex-col gap-2 mt-2">
          {canRetryVerification ? (
            <button
              onClick={retryVerification}
              className="w-full min-h-[48px] rounded-lg font-medium text-sm bg-brand-amber text-black hover:bg-brand-amberDark transition-colors cursor-pointer"
            >
              Retry verification
            </button>
          ) : (
            <button
              onClick={() => pay(sessionId, selectedToken)}
              className="w-full min-h-[48px] rounded-lg font-medium text-sm bg-brand-amber text-black hover:bg-brand-amberDark transition-colors cursor-pointer"
            >
              Confirm &amp; Pay
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full min-h-[48px] rounded-lg font-medium text-sm border border-brand-border text-brand-muted hover:text-brand-body hover:border-brand-body transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-brand-surface rounded-xl border border-brand-border p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-brand-heading font-bold text-lg">
            Unlock Session {sessionId}
          </h2>
          <div className="mt-3 h-px bg-brand-border" />
        </div>

        {renderBody()}
      </div>
    </div>
  )
}
