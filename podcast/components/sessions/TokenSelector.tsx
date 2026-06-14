'use client'

import type { SupportedToken } from '@/lib/web3/contracts'

interface TokenSelectorProps {
  selectedToken: SupportedToken
  onChange: (token: SupportedToken) => void
  sessionPrice: number
}

export function TokenSelector({ selectedToken, onChange, sessionPrice }: TokenSelectorProps) {
  const tokens: SupportedToken[] = ['USDC', 'USDT']

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {tokens.map((token) => {
        const isSelected = selectedToken === token
        return (
          <button
            key={token}
            type="button"
            onClick={() => onChange(token)}
            className={`flex flex-col items-start gap-1 px-4 py-3 rounded-lg border min-h-[56px] text-sm transition-colors cursor-pointer ${
              isSelected
                ? 'border-brand-amber text-brand-amber'
                : 'border-brand-border text-brand-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isSelected ? 'bg-brand-amber' : 'bg-brand-muted'
                }`}
              />
              <span className="font-semibold">{token}</span>
            </div>
            <span className="text-xs pl-4">
              ${sessionPrice} {token}
            </span>
          </button>
        )
      })}
    </div>
  )
}
