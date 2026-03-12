// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDashboardSummary, getByGenero, getByEdad, getByMedicacion, getByTecnica, getByHoras, getUsers } from '@/lib/db'

function authCheck(req: NextRequest): boolean {
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const allUsers = getUsers()

  return NextResponse.json({
    summary:      getDashboardSummary(),
    byGenero:     getByGenero(),
    byEdad:       getByEdad(),
    byMedicacion: getByMedicacion(),
    byTecnica:    getByTecnica(),
    byHoras:      getByHoras(),
    users:        allUsers.slice(0, 200).map(u => ({
      genero: u.genero,
      edad: u.edad,
      medicacion: u.medicacion,
      localidad: u.localidad,
      horas_sueno: u.horas_sueno,
      tecnica_favorita: u.tecnica_favorita,
      country: u.country,
      created_at: u.created_at,
    })),
  })
}
