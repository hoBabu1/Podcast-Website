'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

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
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="text-brand-amber text-sm font-mono cursor-pointer hover:opacity-80 transition-opacity relative"
          title="Click to copy address"
        >
          {copied ? 'Copied!' : short}
        </button>
        <button
          onClick={() => disconnect()}
          className="text-brand-muted text-xs hover:text-brand-body transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return <ConnectButton />
}
