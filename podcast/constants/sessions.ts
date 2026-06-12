export const SESSIONS = [
  {
    id: 1,
    title: 'Introduction to Blockchain and DefiLords',
    price: 0,
    isFree: true,
    description: 'The hook — real value before you pay.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: null,
  },
  {
    id: 2,
    title: 'DefiLords in depth',
    price: 50,
    isFree: false,
    description: 'Liquidity pools, staking, Pendle, and low-risk investments.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: '50000000000000000000',
  },
  {
    id: 3,
    title: 'DefiLords strategies in depth',
    price: 100,
    isFree: false,
    description: 'Advanced yield, vault selection, AI Vaults.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: '100000000000000000000',
  },
] as const

export type Session = (typeof SESSIONS)[number]
