// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }
import { insertSession, updateSession, getMostUsedPattern, updateUser } from '@/lib/db'
import { parseJsonBody } from '@/lib/parse-body'

export async function POST(req: NextRequest) {
  try {
    const { userId, patron, duracionSegundos, completada } = await parseJsonBody(req)

    if (!patron) return NextResponse.json({ error: 'patron requerido' }, { status: 400 })

    const session = await insertSession({
      user_id: userId || null,
      patron,
      duracion_segundos: duracionSegundos || null,
      completada: completada || false,
    })

    // Auto-actualizar técnica favorita del usuario
    if (userId) {
      const topPattern = await getMostUsedPattern(userId)
      if (topPattern) {
        await updateUser(userId, { tecnica_favorita: topPattern })
      }
    }

    return NextResponse.json({ ok: true, sessionId: session.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sessions] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, duracionSegundos, completada } = await parseJsonBody(req)

    if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 })

    const updates: { duracion_segundos?: number; completada?: boolean } = {}
    if (duracionSegundos !== undefined) updates.duracion_segundos = Math.round(Number(duracionSegundos))
    if (completada !== undefined) updates.completada = !!completada

    const ok = await updateSession(sessionId, updates)
    if (!ok) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/sessions] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
