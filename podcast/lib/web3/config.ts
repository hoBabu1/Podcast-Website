import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'
import { http } from 'wagmi'

export const wagmiConfig = getDefaultConfig({
  appName: 'DefiLords',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL!),
  },
  ssr: true,
})
