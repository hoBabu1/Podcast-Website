'use client'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { wagmiConfig } from '@/lib/web3/config'
import { AuthProvider } from '@/components/auth/AuthProvider'
import type { ServerAuthState } from '@/lib/auth/serverAuth'

export function Providers({
  children,
  initialAuth,
}: {
  children: React.ReactNode
  initialAuth: ServerAuthState
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#EF9F27',
            accentColorForeground: '#141410',
            borderRadius: 'medium',
          })}
        >
          <AuthProvider initialAuth={initialAuth}>{children}</AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
