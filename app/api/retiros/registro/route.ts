// app/api/retiros/registro/route.ts — POST inscripción a retiro
import { NextRequest, NextResponse } from 'next/server'
import { registerForRetreat } from '@/lib/db'
import { parseJsonBody } from '@/lib/parse-body'

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req)
    const { retreatId } = body
    if (!retreatId) return NextResponse.json({ error: 'retreatId requerido' }, { status: 400 })

    // Contact fields are always required
    const nombre = (body.nombre as string || '').trim()
    const apellidos = (body.apellidos as string || '').trim()
    const email = (body.email as string || '').trim()
    const telefono = (body.telefono as string || '').trim()

    if (!nombre || !apellidos || !email || !telefono) {
      return NextResponse.json({ error: 'Nombre, apellidos, email y teléfono son obligatorios' }, { status: 400 })
    }

    // Use provided userId or generate a placeholder
    const userId = (body.userId as string) || 'anon-' + crypto.randomUUID()

    const reg = await registerForRetreat(userId, retreatId, { nombre, apellidos, email, telefono })
    return NextResponse.json({ id: reg.id, userId }, { status: 201 })
  } catch (err: any) {
    const status = err.status || 500
    const message = err.message || 'Error al inscribirse'
    if (status < 500) return NextResponse.json({ error: message }, { status })
    console.error('[POST /api/retiros/registro]', message)
    return NextResponse.json({ error: message }, { status })
  }
}
