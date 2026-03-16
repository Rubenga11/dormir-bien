// app/api/admin/retreats/route.ts — CRUD admin retiros
import { NextRequest, NextResponse } from 'next/server'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }
import { getRetreats, getRetreatById, insertRetreat, updateRetreat, deleteRetreat } from '@/lib/db'
import { authCheck } from '@/lib/auth'
import { parseJsonBody } from '@/lib/parse-body'

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await getRetreats())
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await parseJsonBody(req)

    if (!body.title?.trim()) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })
    if (!body.fecha) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.fecha)) return NextResponse.json({ error: 'Formato de fecha inválido (YYYY-MM-DD)' }, { status: 400 })

    const retreat = await insertRetreat({
      title: body.title.trim(),
      image_url: body.image_url || '',
      description: body.description || '',
      fecha: body.fecha,
      price: Number(body.price) || 0,
      plazas: Number(body.plazas) || 0,
      published: body.published ?? false,
    })
    return NextResponse.json(retreat, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al crear retiro'
    console.error('[POST /api/admin/retreats]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await parseJsonBody(req)
    if (!body.id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (body.fecha && !dateRegex.test(body.fecha)) return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 })
    if (body.price !== undefined) body.price = Number(body.price)
    if (body.plazas !== undefined) body.plazas = Number(body.plazas)

    const { id, ...updates } = body
    const ok = await updateRetreat(id, updates)
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(await getRetreatById(id))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar retiro'
    console.error('[PATCH /api/admin/retreats]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { id } = await parseJsonBody(req)
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    const ok = await deleteRetreat(id)
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar retiro'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
