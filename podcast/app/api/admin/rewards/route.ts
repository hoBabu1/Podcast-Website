import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { checkOwnerRole } from '@/lib/admin/queries'
import { getRewardPositions, createRewardPosition } from '@/lib/rewards/queries'

const CreateSchema = z.object({
  session_id: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  winner_label: z.string().trim().min(1).max(200),
  vault_name: z.string().trim().min(1).max(200),
  sponsored_amount: z.number().positive(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  current_yield: z.number().min(0).default(0),
  status: z.enum(['active', 'completed', 'paid']).default('active'),
})

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = await checkOwnerRole(session.email)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const positions = await getRewardPositions()
    return NextResponse.json({ positions })
  } catch (err) {
    console.error('[admin/rewards] query error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = await checkOwnerRole(session.email)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = CreateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const position = await createRewardPosition(parsed.data)
    return NextResponse.json({ position }, { status: 201 })
  } catch (err) {
    console.error('[admin/rewards] create error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
