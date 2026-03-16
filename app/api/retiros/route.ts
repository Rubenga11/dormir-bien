// app/api/retiros/route.ts — GET público: retiros publicados con plazas disponibles
import { NextResponse } from 'next/server'
import { getPublishedRetreats, getRetreatRegistrationCount } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const retreats = await getPublishedRetreats()
  const enriched = await Promise.all(retreats.map(async (r) => {
    const registrations = await getRetreatRegistrationCount(r.id)
    return { ...r, plazas_disponibles: r.plazas > 0 ? Math.max(0, r.plazas - registrations) : null }
  }))
  return NextResponse.json(enriched)
}
