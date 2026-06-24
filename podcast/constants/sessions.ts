export const SESSIONS = [
  {
    id: 1,
    title: 'DeFi Foundations — Free',
    price: 0,
    isFree: true,
    description: 'Blockchain basics, wallets, and how DeFi actually works. No experience needed. We\'ll send you the live session link before the day.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: null,
  },
  {
    id: 2,
    title: 'How to Earn Yield Safely in DeFi',
    price: 50,
    isFree: false,
    description: 'Everything you need to start earning on your crypto — without gambling it away.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: '50000000000000000000',
  },
  {
    id: 3,
    title: 'Advanced Yield Strategies & AI Vaults',
    price: 100,
    isFree: false,
    description: 'Build a passive income DeFi portfolio using advanced capital strategies and AI-driven automation.',
    twitterUrl: 'https://x.com/defilordsss',
    priceUSDC: '100000000000000000000',
  },
] as const

export type Session = (typeof SESSIONS)[number]
