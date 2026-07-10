'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

interface MobileNavProps {
  isLoggedIn: boolean
  isOwner: boolean
  name: string
  email: string
}

/**
 * Mobile-only navigation: a hamburger button that opens a full-width dropdown
 * combining the nav links, the user identity + sign out, and the wallet
 * controls (address / copy / disconnect). Desktop keeps its own inline layout
 * in Navbar — this component is rendered inside an `sm:hidden` wrapper.
 *
 * UI only — sign-out and wallet actions reuse the exact same calls the desktop
 * UserMenu / WalletButton already make. No business or payment logic here.
 */
export function MobileNav({ isLoggedIn, isOwner, name, email }: MobileNavProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()

  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [clearing, setClearing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const busy = clearing || isPending

  const label = name?.trim() || email
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  // Close when tapping outside the menu or pressing Escape.
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

  function handleCopy() {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  async function handleSignOut() {
    if (busy) return
    setClearing(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    startTransition(() => {
      router.replace('/')
      router.refresh()
    })
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-heading hover:bg-brand-surface transition-colors -mr-1"
      >
        {open ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-16 border-b border-brand-border bg-brand-bg shadow-lg z-50"
        >
          <div className="flex flex-col py-2">
            {/* Section: navigation links */}
            <Link
              href="/#sessions"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex min-h-[48px] items-center px-5 text-base text-brand-body hover:bg-brand-surface hover:text-brand-heading transition-colors"
            >
              Sessions
            </Link>
            <Link
              href="https://aivaults.defilords.finance/"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex min-h-[48px] items-center px-5 text-base text-brand-body hover:bg-brand-surface hover:text-brand-heading transition-colors"
            >
              AI Vaults
            </Link>
            <Link
              href="/rewards"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex min-h-[48px] items-center px-5 text-base text-brand-body hover:bg-brand-surface hover:text-brand-heading transition-colors"
            >
              Rewards
            </Link>
            {isLoggedIn && isOwner && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex min-h-[48px] items-center px-5 text-base font-semibold text-brand-amber hover:bg-brand-surface transition-colors"
              >
                Dashboard
              </Link>
            )}

            {/* Section: identity + sign out (or get started) */}
            <div className="my-2 border-t border-brand-border" />
            {isLoggedIn ? (
              <>
                <div className="px-5 py-2">
                  <p className="text-brand-heading text-base font-semibold truncate">{label}</p>
                  <p className="text-brand-muted text-sm truncate">{email}</p>
                </div>
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={busy}
                  className="flex min-h-[48px] items-center px-5 text-base text-brand-body hover:bg-brand-surface hover:text-brand-heading transition-colors disabled:opacity-60"
                >
                  {busy ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <div className="px-5 py-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-brand-amber px-4 text-base font-semibold text-brand-bg hover:bg-brand-amberDark transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Section: wallet */}
            <div className="my-2 border-t border-brand-border" />
            {isConnected && address ? (
              <>
                <div className="flex min-h-[48px] items-center justify-between gap-2 px-5">
                  <span className="font-mono text-sm text-brand-amber truncate">{shortAddress}</span>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 rounded px-2 py-1 text-sm font-medium text-brand-body hover:text-brand-heading transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  role="menuitem"
                  onClick={() => {
                    disconnect()
                    setOpen(false)
                  }}
                  className="flex min-h-[48px] items-center px-5 text-base text-brand-body hover:bg-brand-surface hover:text-brand-heading transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                role="menuitem"
                onClick={() => {
                  openConnectModal?.()
                  setOpen(false)
                }}
                className="flex min-h-[48px] items-center px-5 text-base text-brand-body hover:bg-brand-surface hover:text-brand-heading transition-colors"
              >
                Connect wallet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}
