// app/api/export/json/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUsers, getAllSessions, getSessionsSummary } from '@/lib/db'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('breathe-admin-token')
  if (cookie?.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const includeSessions = req.nextUrl.searchParams.get('include') === 'sessions'
  const userData = await getUsers()
  const date = new Date().toISOString().slice(0, 10)

  let payload: unknown
  if (includeSessions) {
    const sessionData = (await getAllSessions()).map(s => ({
      patron: s.patron,
      duracion_segundos: s.duracion_segundos,
      completada: s.completada,
      created_at: s.created_at,
    }))
    payload = {
      usuarios: userData,
      sesiones: sessionData,
      resumen_sesiones: await getSessionsSummary(),
    }
  } else {
    payload = userData
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="breathe_datos_${date}.json"`,
    },
  })
}
