// app/api/retiros/mis-inscripciones/route.ts — GET inscripciones de un usuario
import { NextRequest, NextResponse } from 'next/server'
import { getUserRetreatRegistrations } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  const retreatIds = await getUserRetreatRegistrations(userId)
  return NextResponse.json(retreatIds)
}
