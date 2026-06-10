'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  email: string
  onNewUser: () => void
}

export function OtpStep({ email, onNewUser }: Props) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = (await res.json()) as {
        verified?: boolean
        isNewUser?: boolean
        error?: string
      }

      if (!res.ok || !data.verified) {
        setError(data.error ?? 'Invalid code')
        return
      }

      if (data.isNewUser) {
        onNewUser()
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setResendCooldown(60)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Failed to resend code.')
      }
    } catch {
      setError('Failed to resend code.')
    }
  }

  return (
    <form onSubmit={handleVerify} className="w-full max-w-sm mx-auto space-y-4">
      <p className="text-brand-body text-sm text-center">
        We sent a 6-digit code to <span className="text-brand-heading">{email}</span>
      </p>

      <div>
        <label htmlFor="code" className="block text-brand-body text-sm mb-2">
          Verification code
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-full px-4 py-3 rounded-lg bg-brand-surface border border-brand-border text-brand-heading placeholder-brand-muted focus:outline-none focus:border-brand-amber transition-colors tracking-widest text-center text-xl"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full py-3 rounded-lg bg-brand-amber text-brand-bg font-semibold hover:bg-brand-amberDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying…' : 'Verify'}
      </button>

      <p className="text-center text-sm">
        {resendCooldown > 0 ? (
          <span className="text-brand-muted">Resend in {resendCooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-brand-amber hover:text-brand-amberDark transition-colors"
          >
            Resend code
          </button>
        )}
      </p>
    </form>
  )
}
