'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clearing, setClearing] = useState(false)
  const busy = clearing || isPending

  async function handleSignOut() {
    if (busy) return
    // Immediate feedback so the click feels instant while the cookie clears.
    setClearing(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    // replace (not push) so the logged-in page doesn't stay in history; refresh
    // re-runs the root layout server-side so the navbar reflects logged-out.
    startTransition(() => {
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="text-brand-muted hover:text-brand-body text-sm transition-colors disabled:opacity-60"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
