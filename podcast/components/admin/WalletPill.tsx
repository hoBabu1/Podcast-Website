'use client'

import { useState } from 'react'

/** A shortened, click-to-copy wallet address pill. */
export function WalletPill({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard unavailable (e.g. insecure context) — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${address}`}
      className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-surface px-2 py-0.5 font-mono text-xs text-brand-amber hover:border-brand-amber transition-colors"
    >
      {copied ? 'Copied!' : short}
    </button>
  )
}
