// app/api/admin/retreats/route.ts — CRUD admin retiros
import { NextRequest, NextResponse } from 'next/server'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }
import { getRetreats, getRetreatById, insertRetreat, updateRetreat, deleteRetreat } from '@/lib/db'
import { authCheck } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await getRetreats())
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await req.json()
    const retreat = await insertRetreat({
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al crear retiro'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    if (body.price !== undefined) body.price = Number(body.price)
    const ok = await updateRetreat(body.id, body)
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(await getRetreatById(body.id))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar retiro'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    const ok = await deleteRetreat(id)
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar retiro'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
