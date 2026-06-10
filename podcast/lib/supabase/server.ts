import { createClient } from '@supabase/supabase-js'

/**
 * Singleton service-role Supabase client. Re-used across requests within a
 * server instance so we don't construct a fresh client object on every call
 * (every API route + every admin/session query previously built its own).
 *
 * Server-only — uses the service-role key, which bypasses RLS. Never import
 * this into a Client Component.
 */
function buildClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Type is inferred from the call so it matches the original (permissive) typing.
let client: ReturnType<typeof buildClient> | null = null

export function createServerSupabaseClient() {
  if (!client) client = buildClient()
  return client
}
