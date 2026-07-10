import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { checkOwnerRole } from '@/lib/admin/queries'
import { updateRewardPosition, deleteRewardPosition } from '@/lib/rewards/queries'

const UpdateSchema = z.object({
  session_id: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  winner_label: z.string().trim().min(1).max(200).optional(),
  vault_name: z.string().trim().min(1).max(200).optional(),
  sponsored_amount: z.number().positive().optional(),
  start_date: z.string().min(1).optional(),
  end_date: z.string().min(1).optional(),
  current_yield: z.number().min(0).optional(),
  status: z.enum(['active', 'completed', 'paid']).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = await checkOwnerRole(session.email)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = UpdateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const position = await updateRewardPosition(params.id, parsed.data)
    if (!position) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ position })
  } catch (err) {
    console.error('[admin/rewards/:id] update error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = await checkOwnerRole(session.email)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await deleteRewardPosition(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/rewards/:id] delete error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
