'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  name: string
  email: string
}

export function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [clearing, setClearing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const busy = clearing || isPending

  // Fall back to the email when no name is on the session (e.g. tokens issued
  // before name was stored — the user re-populates it on next login).
  const label = name?.trim() || email

  // Close the popover when clicking anywhere outside it.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function handleSignOut() {
    if (busy) return
    setClearing(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    startTransition(() => {
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-brand-body hover:text-brand-heading text-base font-medium transition-colors max-w-[10rem] truncate"
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-brand-border bg-brand-surface shadow-lg overflow-hidden z-50"
        >
          <div className="px-4 py-3">
            <p className="text-brand-heading text-sm font-semibold truncate">{label}</p>
            <p className="text-brand-muted text-xs truncate">{email}</p>
          </div>
          <div className="border-t border-brand-border" />
          <button
            role="menuitem"
            onClick={handleSignOut}
            disabled={busy}
            className="w-full text-left px-4 py-2.5 text-sm text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors disabled:opacity-60"
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
