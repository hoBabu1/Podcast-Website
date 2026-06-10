'use client'

import { useState } from 'react'

interface Props {
  onSuccess: (email: string) => void
}

export function EmailStep({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many attempts. Try again in 15 minutes.')
        } else {
          setError('Failed to send code. Try again.')
        }
        return
      }

      if (data.success) {
        onSuccess(email)
      }
    } catch {
      setError('Failed to send code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      <div>
        <label htmlFor="email" className="block text-brand-body text-sm mb-2">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-lg bg-brand-surface border border-brand-border text-brand-heading placeholder-brand-muted focus:outline-none focus:border-brand-amber transition-colors"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-brand-amber text-brand-bg font-semibold hover:bg-brand-amberDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending…' : 'Send OTP'}
      </button>
    </form>
  )
}
