import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { checkOwnerRole, getStats } from '@/lib/admin/queries'

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = await checkOwnerRole(session.email)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const stats = await getStats()
  return NextResponse.json(stats)
}
