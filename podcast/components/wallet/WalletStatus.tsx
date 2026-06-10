'use client'

import { useAccount } from 'wagmi'

export function WalletStatus() {
  const { address, isConnected } = useAccount()

  if (isConnected && address) {
    return (
      <p className="text-brand-amber text-xs font-mono">
        {address.slice(0, 6)}...{address.slice(-4)}
      </p>
    )
  }

  return <p className="text-brand-muted text-xs">Connect wallet to pay</p>
}
