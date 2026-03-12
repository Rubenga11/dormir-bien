// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { insertSession, getMostUsedPattern, updateUser } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId, patron, duracionSegundos, completada } = await req.json()

    if (!patron) return NextResponse.json({ error: 'patron requerido' }, { status: 400 })

    insertSession({
      user_id: userId || null,
      patron,
      duracion_segundos: duracionSegundos || null,
      completada: completada || false,
    })

    // Auto-actualizar técnica favorita del usuario
    if (userId) {
      const topPattern = getMostUsedPattern(userId)
      if (topPattern) {
        updateUser(userId, { tecnica_favorita: topPattern })
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sessions] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
