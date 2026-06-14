export const SESSIONS = [
  {
    id: 1,
    title: 'DeFi Foundations',
    price: 0,
    isFree: true,
    description: 'Blockchain basics, wallets, and how DeFi actually works — free.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: null,
  },
  {
    id: 2,
    title: 'DeFi Intermediate',
    price: 50,
    isFree: false,
    description: 'Liquidity pools, staking, Pendle, and low-risk yield strategies.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: '50000000000000000000',
  },
  {
    id: 3,
    title: 'DeFi Advanced',
    price: 100,
    isFree: false,
    description: 'High-yield strategies, vault selection, and AI Vaults deep dive.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: '100000000000000000000',
  },
] as const

export type Session = (typeof SESSIONS)[number]
