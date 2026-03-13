// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }
import { insertSession, getMostUsedPattern, updateUser } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId, patron, duracionSegundos, completada } = await req.json()

    if (!patron) return NextResponse.json({ error: 'patron requerido' }, { status: 400 })

    await insertSession({
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

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sessions] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
