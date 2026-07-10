export type RewardStatus = 'active' | 'completed' | 'paid'

export interface RewardPositionRow {
  id: string
  session_id: 1 | 2 | 3
  winner_label: string
  vault_name: string
  sponsored_amount: number
  start_date: string
  end_date: string
  current_yield: number
  status: RewardStatus
  created_at: string
  updated_at: string
}

export interface RewardPositionInsert {
  session_id: 1 | 2 | 3
  winner_label: string
  vault_name: string
  sponsored_amount: number
  start_date: string
  end_date: string
  current_yield?: number
  status?: RewardStatus
}

export interface RewardPositionUpdate {
  session_id?: 1 | 2 | 3
  winner_label?: string
  vault_name?: string
  sponsored_amount?: number
  start_date?: string
  end_date?: string
  current_yield?: number
  status?: RewardStatus
}
