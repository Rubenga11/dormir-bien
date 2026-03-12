// app/api/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUsers } from '@/lib/db'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('breathe-admin-token')
  if (cookie?.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const data = getUsers()

  const BOM = '\uFEFF'
  const headers = ['G\u00e9nero','Edad','Medicaci\u00f3n','Localidad','Horas Sue\u00f1o','T\u00e9cnica','Pa\u00eds','Fecha']
  const rows = data.map(u =>
    [u.genero, u.edad, u.medicacion, `"${(u.localidad||'').replace(/"/g,'""')}"`,
     u.horas_sueno, u.tecnica_favorita||'', u.country||'', (u.created_at||'').slice(0,10)].join(',')
  )

  const csv = BOM + [headers.join(','), ...rows].join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="breathe_datos_${date}.csv"`,
    },
  })
}
