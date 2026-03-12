// app/api/admin/retreats/route.ts — CRUD admin retiros
import { NextRequest, NextResponse } from 'next/server'
import { getRetreats, getRetreatById, insertRetreat, updateRetreat, deleteRetreat } from '@/lib/db'

function authCheck(req: NextRequest): boolean {
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(getRetreats())
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const retreat = insertRetreat({
    title: body.title || '',
    image_url: body.image_url || '',
    description: body.description || '',
    start_date: body.start_date || '',
    end_date: body.end_date || '',
    location: body.location || '',
    price: Number(body.price) || 0,
    registration_url: body.registration_url || '',
    published: body.published ?? false,
  })
  return NextResponse.json(retreat, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  if (body.price !== undefined) body.price = Number(body.price)
  const ok = updateRetreat(body.id, body)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(getRetreatById(body.id))
}

export async function DELETE(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const ok = deleteRetreat(id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
