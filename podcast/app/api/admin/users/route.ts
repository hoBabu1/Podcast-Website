import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { checkOwnerRole, getUsers } from '@/lib/admin/queries'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(200).default(''),
})

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = await checkOwnerRole(session.email)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { page, search } = parsed.data
  const result = await getUsers(page, search)
  return NextResponse.json(result)
}
