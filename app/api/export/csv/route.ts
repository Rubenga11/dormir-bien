// app/api/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUsers, getAllSessions } from '@/lib/db'
import { authCheck } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const includeSessions = req.nextUrl.searchParams.get('include') === 'sessions'
  const data = await getUsers()

  const BOM = '\uFEFF'
  const headers = ['Género','Edad','Medicación','Ciudad','CP','Horas Sueño','Técnica','País','Fecha']
  const rows = data.map(u =>
    [u.genero, u.edad, u.medicacion, `"${(u.ciudad||'').replace(/"/g,'""')}"`, u.cp||'',
     u.horas_sueno, u.tecnica_favorita||'', u.country||'', (u.created_at||'').slice(0,10)].join(',')
  )

  let csv = BOM + [headers.join(','), ...rows].join('\n')

  if (includeSessions) {
    const sessions = await getAllSessions()
    const sessionHeaders = ['Patrón','Duración (s)','Completada','Fecha']
    const sessionRows = sessions.map(s =>
      [s.patron, s.duracion_segundos ?? '', s.completada ? 'Sí' : 'No', (s.created_at||'').slice(0,19)].join(',')
    )
    csv += '\n\n# Sesiones\n' + [sessionHeaders.join(','), ...sessionRows].join('\n')
  }

  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="breathe_datos_${date}.csv"`,
    },
  })
}
