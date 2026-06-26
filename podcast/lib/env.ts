import { z } from 'zod'

const serverEnvSchema = z.object({
  SESSION_SECRET: z.string().min(32),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  BREVO_API_KEY: z.string().min(1),
  BREVO_LIST_ID: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  ALCHEMY_RPC_URL: z.string().url(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_WC_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_ALCHEMY_RPC_URL: z.string().url(),
  NEXT_PUBLIC_PAYMENT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address'),
  NEXT_PUBLIC_USDC_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address'),
  NEXT_PUBLIC_CHAIN_ID: z.string().min(1),
  NEXT_PUBLIC_HOTJAR_ID: z.string().optional(),
  NEXT_PUBLIC_X_PIXEL_ID: z.string().optional(),
})

export function validateEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  const isServer = typeof window === 'undefined'

  const clientResult = clientEnvSchema.safeParse(rawEnv)
  if (!clientResult.success) {
    const missing = clientResult.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid public env vars: ${missing}`)
  }

  if (isServer) {
    const serverResult = serverEnvSchema.safeParse(rawEnv)
    if (!serverResult.success) {
      const missing = serverResult.error.issues.map((i) => i.path.join('.')).join(', ')
      throw new Error(`Missing or invalid server env vars: ${missing}`)
    }
    return {
      ...serverResult.data,
      ...clientResult.data,
    }
  }

  return clientResult.data
}

// Skip auto-validation during tests — each test sets up its own env
export const env = process.env.NODE_ENV !== 'test' ? validateEnv() : ({} as ReturnType<typeof validateEnv>)

export type Env = ReturnType<typeof validateEnv>
