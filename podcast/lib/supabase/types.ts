export interface UserRow {
  id: string
  email: string
  name: string
  wallet_address: string | null
  created_at: string
  updated_at: string
}

export interface UserInsert {
  email: string
  name: string
  wallet_address?: string | null
}

export interface UserUpdate {
  name?: string
  wallet_address?: string | null
  updated_at?: string
}

export interface SessionAccessRow {
  id: string
  user_id: string
  session_id: 2 | 3
  tx_hash: string
  chain_id: number
  amount_usdc: string
  granted_at: string
}

export interface SessionAccessInsert {
  user_id: string
  session_id: 2 | 3
  tx_hash: string
  chain_id?: number
  amount_usdc: string
}

export interface UserRoleRow {
  id: string
  email: string
  role: 'owner'
  created_at: string
}

export interface UserWalletRow {
  id: string
  user_id: string
  wallet_address: string
  created_at: string
}

export interface UserWalletInsert {
  user_id: string
  wallet_address: string
}
