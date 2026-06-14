import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  AdminStats,
  AdminUser,
  AdminPayment,
  SessionBreakdown,
} from '@/types/admin'

/**
 * Owner-dashboard data access. Every admin query lives in this one file so that
 * no admin page, component, or route ever touches Supabase directly (CLAUDE.md:
 * "No direct Supabase calls inside components"). All reads use the service-role
 * client, so this module is server-only — never import it into a Client Component.
 */

/** Rows shown per page across all admin tables. */
export const ADMIN_PAGE_SIZE = 20

/**
 * High-level stats for the dashboard cards.
 * - totalRevenue is the sum of every `amount_usdc` paid (stored as a numeric
 *   string in the DB, summed here as a plain number for display).
 */
export async function getStats(): Promise<AdminStats> {
  const supabase = createServerSupabaseClient()

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { data: access } = await supabase
    .from('session_access')
    .select('session_id, amount_usdc')

  const rows = access ?? []
  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.amount_usdc), 0)
  const session2Count = rows.filter((r) => r.session_id === 2).length
  const session3Count = rows.filter((r) => r.session_id === 3).length

  return {
    totalUsers: totalUsers ?? 0,
    totalRevenue,
    session2Count,
    session3Count,
  }
}

/**
 * Count of users on each session. Session 1 is free, so every registered user
 * is counted under `free`; sessions 2 & 3 count their paid unlocks.
 */
export async function getSessionBreakdown(): Promise<SessionBreakdown> {
  const { totalUsers, session2Count, session3Count } = await getStats()
  return {
    free: totalUsers,
    session2: session2Count,
    session3: session3Count,
  }
}

/**
 * Paginated, searchable list of users (20 per page). Search matches name OR
 * email (case-insensitive). Each user is enriched with their wallet addresses
 * and the sessions they have unlocked (session 1 is always included as free).
 */
export async function getUsers(
  page: number,
  search: string
): Promise<{ users: AdminUser[]; total: number }> {
  const supabase = createServerSupabaseClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE - 1

  let query = supabase
    .from('users')
    .select('id, name, email, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: users, count } = await query
  const userList = users ?? []
  const ids = userList.map((u) => u.id)

  let walletRows: { user_id: string; wallet_address: string }[] = []
  let accessRows: { user_id: string; session_id: number }[] = []

  if (ids.length) {
    const [wallets, access] = await Promise.all([
      supabase.from('user_wallets').select('user_id, wallet_address').in('user_id', ids),
      supabase.from('session_access').select('user_id, session_id').in('user_id', ids),
    ])
    walletRows = wallets.data ?? []
    accessRows = access.data ?? []
  }

  const walletsByUser = new Map<string, string[]>()
  for (const row of walletRows) {
    const list = walletsByUser.get(row.user_id) ?? []
    list.push(row.wallet_address)
    walletsByUser.set(row.user_id, list)
  }

  const paidByUser = new Map<string, number[]>()
  for (const row of accessRows) {
    const list = paidByUser.get(row.user_id) ?? []
    list.push(row.session_id)
    paidByUser.set(row.user_id, list)
  }

  const adminUsers: AdminUser[] = userList.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    wallet_addresses: walletsByUser.get(u.id) ?? [],
    created_at: u.created_at,
    sessions_unlocked: Array.from(
      new Set([1, ...(paidByUser.get(u.id) ?? [])])
    ).sort((a, b) => a - b),
  }))

  return { users: adminUsers, total: count ?? 0 }
}

/**
 * Paginated payment history (20 per page), most recent first. Joins each
 * payment back to the payer's email for display.
 */
export async function getPayments(
  page: number
): Promise<{ payments: AdminPayment[]; total: number }> {
  const supabase = createServerSupabaseClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE - 1

  const { data, count } = await supabase
    .from('session_access')
    .select(
      'id, user_id, session_id, amount_usdc, token_symbol, token_address, tx_hash, chain_id, granted_at',
      { count: 'exact' }
    )
    .order('granted_at', { ascending: false })
    .range(from, to)

  const rows = data ?? []
  const ids = Array.from(new Set(rows.map((r) => r.user_id)))

  const emailById = new Map<string, string>()
  if (ids.length) {
    const { data: users } = await supabase.from('users').select('id, email').in('id', ids)
    for (const u of users ?? []) emailById.set(u.id, u.email)
  }

  const payments: AdminPayment[] = rows.map((r) => ({
    id: r.id,
    user_email: emailById.get(r.user_id) ?? '',
    session_id: r.session_id,
    amount_usdc: Number(r.amount_usdc),
    token_symbol: (r.token_symbol ?? 'USDC') as 'USDC' | 'USDT',
    token_address: r.token_address ?? '',
    tx_hash: r.tx_hash,
    chain_id: r.chain_id,
    granted_at: r.granted_at,
  }))

  return { payments, total: count ?? 0 }
}

/** True if the email belongs to an owner (the only privileged role). */
export async function checkOwnerRole(email: string): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('email', email.trim().toLowerCase())
    .eq('role', 'owner')
    .single()

  return !!data
}
