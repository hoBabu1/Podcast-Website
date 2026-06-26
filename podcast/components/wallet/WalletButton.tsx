'use client'

import { useEffect, useRef, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useAccountEffect, useDisconnect } from 'wagmi'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useAccountEffect({
    onConnect(data) {
      if (data.isReconnected) return
      if (typeof window === 'undefined') return
      const w = window as Window & { twq?: (...args: unknown[]) => void }
      if (typeof w.twq !== 'function') return
      w.twq('event', 'tw-rbp50-rd89j', {
        value: null,
        currency: null,
        contents: [{ content_type: null, content_id: null, content_name: null, content_price: null, num_items: null, content_group_id: null }],
        status: null,
        conversion_id: null,
        email_address: null,
      })
    },
  })

  // Close the popover when clicking outside it or pressing Escape.
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

  if (isConnected && address) {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title="Wallet"
          className="text-brand-amber text-sm font-mono cursor-pointer hover:opacity-80 transition-opacity"
        >
          {short}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-44 rounded-lg border border-brand-border bg-brand-surface shadow-lg overflow-hidden z-50"
          >
            <button
              role="menuitem"
              onClick={handleCopy}
              className="w-full text-left px-4 py-2.5 text-sm text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors"
            >
              {copied ? 'Copied!' : 'Copy address'}
            </button>
            <div className="border-t border-brand-border" />
            <button
              role="menuitem"
              onClick={() => {
                disconnect()
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return <ConnectButton />
}
