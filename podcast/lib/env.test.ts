import { validateEnv } from './env'

const validEnv = {
  // Server vars
  SESSION_SECRET: 'supersecretthatis32charsatleast!!',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  SUPABASE_URL: 'https://abc.supabase.co',
  BREVO_API_KEY: 'brevo-key',
  BREVO_LIST_ID: '42',
  BREVO_SENDER_EMAIL: 'hello@defilords.com',
  ALCHEMY_RPC_URL: 'https://base-mainnet.g.alchemy.com/v2/key',
  // Client vars
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  NEXT_PUBLIC_WC_PROJECT_ID: 'wc-project-id',
  NEXT_PUBLIC_ALCHEMY_RPC_URL: 'https://base-mainnet.g.alchemy.com/v2/testkey',
  NEXT_PUBLIC_PAYMENT_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  NEXT_PUBLIC_USDC_ADDRESS: '0xf7464321dE37BdE4C03AAeeF6b1e7b71379A9a64',
  NEXT_PUBLIC_CHAIN_ID: '8453',
}

describe('validateEnv', () => {
  it('passes when all required vars are present and valid', () => {
    expect(() => validateEnv(validEnv)).not.toThrow()
  })

  it('returns parsed env object on success', () => {
    const result = validateEnv(validEnv)
    expect(result.NEXT_PUBLIC_CHAIN_ID).toBe('8453')
    expect(result.BREVO_SENDER_EMAIL).toBe('hello@defilords.com')
  })

  it('throws when a server var is missing', () => {
    const { SESSION_SECRET, ...withoutSecret } = validEnv
    expect(() => validateEnv(withoutSecret)).toThrow(/SESSION_SECRET/)
  })

  it('throws when a client var is missing', () => {
    const { NEXT_PUBLIC_SUPABASE_URL, ...withoutUrl } = validEnv
    expect(() => validateEnv(withoutUrl)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('throws when SUPABASE_URL is not a valid URL', () => {
    expect(() => validateEnv({ ...validEnv, SUPABASE_URL: 'not-a-url' })).toThrow(/SUPABASE_URL/)
  })

  it('throws when BREVO_SENDER_EMAIL is not a valid email', () => {
    expect(() => validateEnv({ ...validEnv, BREVO_SENDER_EMAIL: 'not-an-email' })).toThrow(/BREVO_SENDER_EMAIL/)
  })

  it('throws when NEXT_PUBLIC_PAYMENT_ADDRESS is not a valid Ethereum address', () => {
    expect(() => validateEnv({ ...validEnv, NEXT_PUBLIC_PAYMENT_ADDRESS: '0xinvalid' })).toThrow(
      /NEXT_PUBLIC_PAYMENT_ADDRESS/
    )
  })

  it('accepts a missing NEXT_PUBLIC_HOTJAR_ID since it is optional', () => {
    const { NEXT_PUBLIC_HOTJAR_ID, ...withoutHotjar } = { ...validEnv, NEXT_PUBLIC_HOTJAR_ID: 'hj123' }
    expect(() => validateEnv(withoutHotjar)).not.toThrow()
  })

  it('throws when multiple vars are missing and lists all of them', () => {
    const { SESSION_SECRET, SUPABASE_URL, ...partial } = validEnv
    try {
      validateEnv(partial)
      fail('Expected to throw')
    } catch (err) {
      expect((err as Error).message).toMatch(/SESSION_SECRET/)
      expect((err as Error).message).toMatch(/SUPABASE_URL/)
    }
  })
})
