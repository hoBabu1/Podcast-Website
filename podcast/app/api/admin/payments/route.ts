import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { checkOwnerRole, getPayments } from '@/lib/admin/queries'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = await checkOwnerRole(session.email)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({ page: searchParams.get('page') ?? undefined })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const result = await getPayments(parsed.data.page)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[admin/payments] query error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
