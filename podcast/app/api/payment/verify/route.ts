import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyERC20Payment } from '@/lib/web3/verify'

const BodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid tx hash'),
  sessionId: z.union([z.literal(2), z.literal(3)]),
  tokenSymbol: z.enum(['USDC', 'USDT']),
  tokenAddress: z.string().startsWith('0x'),
})

// Base Sepolia chain ID — switch to 8453 for mainnet
const CHAIN_ID = 84532

const AMOUNT_BY_SESSION: Record<2 | 3, string> = {
  2: '50',
  3: '100',
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    return await handleVerify(req)
  } catch (err) {
    // Catches anything thrown by JSON parsing or the on-chain RPC call so the
    // client never sees a raw stack trace.
    console.error('[payment/verify] unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

async function handleVerify(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { txHash, sessionId, tokenSymbol, tokenAddress } = body.data
  const supabase = createServerSupabaseClient()

  // Reject if txHash already used — prevents replay attacks
  const { data: existing } = await supabase
    .from('session_access')
    .select('id')
    .eq('tx_hash', txHash)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
  }

  // Read decimals from server-side env so they can change without a code deploy
  const decimals =
    tokenSymbol === 'USDT'
      ? Number(process.env.USDT_DECIMALS ?? 18)
      : Number(process.env.USDC_DECIMALS ?? 18)

  // Verify on-chain: status, token contract, recipient, amount
  const result = await verifyERC20Payment(txHash, sessionId, tokenAddress, decimals)
  if (!result.valid) {
    console.error('[payment/verify] on-chain check failed:', result.reason, txHash)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  // The payment is verified on-chain at this point, so a transient DB failure here
  // would strand a user who has already paid. Retry the insert a few times with a
  // short backoff before giving up. Safe to retry: the txHash uniqueness check above
  // plus the DB constraint prevent any double-grant.
  let insertError: { message: string; code?: string } | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.from('session_access').insert({
      user_id: session.userId,
      session_id: sessionId,
      tx_hash: txHash,
      chain_id: CHAIN_ID,
      amount_usdc: AMOUNT_BY_SESSION[sessionId],
      token_symbol: tokenSymbol,
      token_address: tokenAddress,
    })

    if (!error) {
      insertError = null
      break
    }

    insertError = error
    console.error(`[payment/verify] insert attempt ${attempt}/3 failed:`, error.message)
    if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt))
  }

  if (insertError) {
    // Payment is valid but could not be recorded. Tell the client it's safe to retry
    // verification with the same txHash — replay protection won't block it because no
    // row was written.
    console.error('[payment/verify] insert failed after retries:', insertError)
    return NextResponse.json(
      { error: 'Payment received but could not be saved. Please retry.', retryable: true },
      { status: 503 }
    )
  }

  return NextResponse.json({ success: true })
}
