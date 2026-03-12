// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getDashboardSummary, getByGenero, getByEdad, getByMedicacion, getByTecnica, getByHoras, getUsers,
  getSessionsSummary, getSessionsByTecnica, getSessionsByDay, getSessionsByHour,
  getEngagementDistribution, getAllSessions,
  getTecnicaByGenero, getTecnicaByEdad, getTecnicaByMedicacion,
  getCompletionByMedicacion, getDuracionByEdad, getHorasSuenoByTecnica, getMedicacionByHorasSueno,
  getUsersByCountry, getUsersByCiudad, getSessionsByCountry, getGeoTable,
} from '@/lib/db'

function authCheck(req: NextRequest): boolean {
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const section = req.nextUrl.searchParams.get('section') || 'resumen'

  if (section === 'sesiones') {
    const recentSessions = getAllSessions().slice(0, 50).map(s => ({
      patron: s.patron,
      duracion_segundos: s.duracion_segundos,
      completada: s.completada,
      created_at: s.created_at,
    }))

    return NextResponse.json({
      sessionSummary: getSessionsSummary(),
      sessionsByTecnica: getSessionsByTecnica(),
      sessionsByDay: getSessionsByDay(90),
      sessionsByHour: getSessionsByHour(),
      engagement: getEngagementDistribution(),
      recentSessions,
    })
  }

  if (section === 'correlaciones') {
    return NextResponse.json({
      tecnicaByGenero: getTecnicaByGenero(),
      tecnicaByEdad: getTecnicaByEdad(),
      tecnicaByMedicacion: getTecnicaByMedicacion(),
      completionByMedicacion: getCompletionByMedicacion(),
      duracionByEdad: getDuracionByEdad(),
      horasSuenoByTecnica: getHorasSuenoByTecnica(),
      medicacionByHorasSueno: getMedicacionByHorasSueno(),
    })
  }

  if (section === 'geo') {
    return NextResponse.json({
      byCountry: getUsersByCountry(),
      byCiudad: getUsersByCiudad(),
      sessionsByCountry: getSessionsByCountry(),
      geoTable: getGeoTable(),
    })
  }

  // Default: resumen (backwards compatible)
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
      ciudad: u.ciudad,
      cp: u.cp,
      horas_sueno: u.horas_sueno,
      tecnica_favorita: u.tecnica_favorita,
      country: u.country,
      created_at: u.created_at,
    })),
  })
}
