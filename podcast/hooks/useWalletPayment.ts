'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract } from 'wagmi'
import { USDC_ADDRESS, USDC_ABI } from '@/lib/web3/contracts'
import { SESSIONS } from '@/constants/sessions'
import { useAuthContext } from '@/components/auth/AuthProvider'

export type PaymentStatus =
  | 'idle'
  | 'saving-wallet'
  | 'sending-payment'
  | 'confirming'
  | 'verifying'
  | 'success'
  | 'error'

// A payment whose on-chain transfer succeeded but whose server-side verification
// has not yet been recorded. Held so the user can re-verify WITHOUT paying again.
type PendingPayment = { txHash: `0x${string}`; sessionId: 2 | 3 }

export function useWalletPayment() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { user, refresh } = useAuthContext()
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingPayment | null>(null)

  // Verify a txHash with the server. Separated from `pay` so a transient verify
  // failure can be retried against the SAME on-chain payment instead of charging
  // the user a second time.
  async function verify(txHash: `0x${string}`, sessionId: 2 | 3): Promise<void> {
    setStatus('verifying')
    const verifyRes = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash, sessionId }),
    })

    if (!verifyRes.ok) {
      const data = (await verifyRes.json()) as { error?: string; retryable?: boolean }
      // Keep the payment around so the user can retry verification without re-paying.
      setPending({ txHash, sessionId })
      const err = new Error(data.error ?? 'Payment verification failed') as Error & {
        retryable?: boolean
      }
      err.retryable = data.retryable
      throw err
    }

    // Verified and recorded — clear any pending payment.
    setPending(null)
    setStatus('success')
    // Update shared access state so the homepage cards reflect the unlock.
    await refresh()
    router.push(`/sessions/${sessionId}`)
  }

  async function pay(sessionId: 2 | 3): Promise<void> {
    setError(null)
    setStatus('idle')

    if (!user) {
      router.push('/login')
      return
    }

    if (!isConnected || !address) {
      setError('Connect your wallet first')
      return
    }

    const session = SESSIONS.find((s) => s.id === sessionId)
    if (!session || session.isFree || !session.priceUSDC) return

    try {
      setStatus('saving-wallet')
      const saveRes = await fetch('/api/wallet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      })
      if (!saveRes.ok) throw new Error('Failed to save wallet')

      setStatus('sending-payment')
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [
          process.env.NEXT_PUBLIC_PAYMENT_ADDRESS as `0x${string}`,
          BigInt(session.priceUSDC),
        ],
      })

      await verify(hash, sessionId)
    } catch (err) {
      console.error('[useWalletPayment]', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setStatus('error')
    }
  }

  // Re-run verification for a payment that already went through on-chain. Does NOT
  // send another transaction, so it cannot double-charge.
  async function retryVerification(): Promise<void> {
    if (!pending) return
    setError(null)
    try {
      await verify(pending.txHash, pending.sessionId)
    } catch (err) {
      console.error('[useWalletPayment] retry', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setStatus('error')
    }
  }

  const isPaying =
    status !== 'idle' && status !== 'error' && status !== 'success'

  return { pay, retryVerification, canRetryVerification: pending !== null, status, error, isPaying }
}
