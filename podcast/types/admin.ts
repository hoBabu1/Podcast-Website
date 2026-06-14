export type AdminStats = {
  totalUsers: number
  totalRevenue: number
  session2Count: number
  session3Count: number
}

export type AdminUser = {
  id: string
  name: string
  email: string
  wallet_addresses: string[]
  created_at: string
  sessions_unlocked: number[]
}

export type AdminPayment = {
  id: string
  user_email: string
  session_id: number
  amount_usdc: number
  token_symbol: 'USDC' | 'USDT'
  token_address: string
  tx_hash: string
  chain_id: number
  granted_at: string
}

export type SessionBreakdown = {
  free: number
  session2: number
  session3: number
}
