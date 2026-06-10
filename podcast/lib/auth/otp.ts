import { createServerSupabaseClient } from '@/lib/supabase/server'

export function generateOtp(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0')
}

export async function cleanupExpiredOtps(email: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  await supabase
    .from('otp_codes')
    .delete()
    .eq('email', email)
    .or('used.eq.true,expires_at.lt.now()')
}

export async function storeOtp(email: string, code: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from('otp_codes')
    .select('id')
    .eq('email', email)
    .gte('created_at', windowStart)

  if (recent && recent.length >= 3) {
    throw new Error('RATE_LIMIT')
  }

  await supabase.from('otp_codes').delete().eq('email', email)

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('otp_codes')
    .insert({ email, code, expires_at: expiresAt })

  if (error) throw new Error(`Failed to store OTP: ${error.message}`)
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ valid: boolean; reason?: 'expired' | 'used' | 'invalid' | 'too_many_attempts' }> {
  const supabase = createServerSupabaseClient()

  const { data: rows } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)

  const row = rows?.[0]

  if (!row) {
    return { valid: false, reason: 'invalid' }
  }

  if (row.used) {
    return { valid: false, reason: 'used' }
  }

  if (new Date(row.expires_at) < new Date()) {
    return { valid: false, reason: 'expired' }
  }

  if (row.attempts >= 3) {
    return { valid: false, reason: 'too_many_attempts' }
  }

  // Single update: always bump attempts, and mark used in the same round trip
  // when the code matches (one DB call instead of two on the success path).
  const isMatch = row.code === code
  const nextAttempts = row.attempts + 1
  await supabase
    .from('otp_codes')
    .update(isMatch ? { attempts: nextAttempts, used: true } : { attempts: nextAttempts })
    .eq('id', row.id)

  if (!isMatch) {
    if (nextAttempts >= 3) {
      return { valid: false, reason: 'too_many_attempts' }
    }
    return { valid: false, reason: 'invalid' }
  }

  return { valid: true }
}
