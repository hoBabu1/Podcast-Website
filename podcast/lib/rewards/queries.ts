import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  RewardPositionRow,
  RewardPositionInsert,
  RewardPositionUpdate,
} from '@/types/rewards'

/**
 * Data access for the Rewards Tracker. Same pattern as `lib/admin/queries.ts`:
 * every Supabase call for reward_positions lives here so no page, component,
 * or route touches Supabase directly. All reads/writes use the service-role
 * client — this module is server-only.
 */

/** All reward positions, most recently started first. Used by both the
 * public tracker (`/rewards`) and the admin CRUD page (`/admin/rewards`). */
export async function getRewardPositions(): Promise<RewardPositionRow[]> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('reward_positions')
    .select('*')
    .order('start_date', { ascending: false })

  return (data ?? []) as RewardPositionRow[]
}

export async function getRewardPositionById(
  id: string
): Promise<RewardPositionRow | null> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('reward_positions')
    .select('*')
    .eq('id', id)
    .single()

  return (data as RewardPositionRow) ?? null
}

export async function createRewardPosition(
  input: RewardPositionInsert
): Promise<RewardPositionRow> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('reward_positions')
    .insert(input)
    .select('*')
    .single()

  if (error || !data) throw error ?? new Error('Failed to create reward position')
  return data as RewardPositionRow
}

export async function updateRewardPosition(
  id: string,
  input: RewardPositionUpdate
): Promise<RewardPositionRow | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('reward_positions')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return (data as RewardPositionRow) ?? null
}

export async function deleteRewardPosition(id: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('reward_positions').delete().eq('id', id)
  if (error) throw error
}
