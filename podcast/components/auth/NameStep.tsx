'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  email: string
}

export function NameStep({ email }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        setError('Something went wrong. Try again.')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-brand-heading text-2xl font-bold">Welcome to DefiLords</h2>
        <p className="text-brand-body text-sm mt-2">One last step — what should we call you?</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-brand-body text-sm mb-2">
          Your name
        </label>
        <input
          id="name"
          type="text"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Satoshi"
          className="w-full px-4 py-3 rounded-lg bg-brand-surface border border-brand-border text-brand-heading placeholder-brand-muted focus:outline-none focus:border-brand-amber transition-colors"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || name.trim().length < 2}
        className="w-full py-3 rounded-lg bg-brand-amber text-brand-bg font-semibold hover:bg-brand-amberDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account…' : 'Continue'}
      </button>
    </form>
  )
}
