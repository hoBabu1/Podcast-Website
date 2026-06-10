import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const BodySchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { walletAddress } = body.data
  const supabase = createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('user_wallets')
    .select('id')
    .eq('user_id', session.userId)
    .eq('wallet_address', walletAddress)
    .single()

  if (existing) return NextResponse.json({ success: true })

  const { error } = await supabase
    .from('user_wallets')
    .insert({ user_id: session.userId, wallet_address: walletAddress })

  if (error) {
    console.error('[wallet/save] insert error:', error)
    return NextResponse.json({ error: 'Failed to save wallet' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
