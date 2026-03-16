// app/api/retiros/route.ts — GET público: retiros publicados
import { NextResponse } from 'next/server'
import { getPublishedRetreats } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getPublishedRetreats())
}
