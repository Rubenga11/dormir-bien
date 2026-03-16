// app/api/retiros/registro/route.ts — POST inscripción a retiro
import { NextRequest, NextResponse } from 'next/server'
import { insertUser, registerForRetreat } from '@/lib/db'
import { parseJsonBody } from '@/lib/parse-body'

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req)
    const { retreatId } = body
    if (!retreatId) return NextResponse.json({ error: 'retreatId requerido' }, { status: 400 })

    let userId = body.userId as string | undefined

    // If no userId, create a new user from registration fields
    if (!userId) {
      if (!body.genero || !body.edad || !body.medicacion || !body.ciudad || !body.cp || !body.horas_sueno) {
        return NextResponse.json({ error: 'Campos de registro incompletos' }, { status: 400 })
      }
      const user = await insertUser({
        genero: body.genero,
        edad: body.edad,
        medicacion: body.medicacion,
        ciudad: body.ciudad,
        cp: body.cp,
        horas_sueno: body.horas_sueno,
        email: body.email || null,
        consiente_email: body.consiente_email ?? false,
      })
      userId = user.id
    }

    const reg = await registerForRetreat(userId, retreatId)
    return NextResponse.json({ id: reg.id, userId }, { status: 201 })
  } catch (err: any) {
    const status = err.status || 500
    const message = err.message || 'Error al inscribirse'
    if (status < 500) return NextResponse.json({ error: message }, { status })
    console.error('[POST /api/retiros/registro]', message)
    return NextResponse.json({ error: message }, { status })
  }
}
