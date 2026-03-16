// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getDashboardSummary, getByGenero, getByEdad, getByMedicacion, getByTecnica, getByHoras, getUsersWithStats,
  getSessionsSummary, getSessionsByTecnica, getSessionsByDay, getSessionsByHour,
  getEngagementDistribution, getAllSessions,
  getTecnicaByGenero, getTecnicaByEdad, getTecnicaByMedicacion,
  getCompletionByMedicacion, getDuracionByEdad, getHorasSuenoByTecnica, getMedicacionByHorasSueno,
  getUsersByCountry, getUsersByCiudad, getSessionsByCountry, getGeoTable,
} from '@/lib/db'
import { authCheck } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const section = req.nextUrl.searchParams.get('section') || 'resumen'

  try {
    if (section === 'sesiones') {
      const allSessions = await getAllSessions()
      const recentSessions = allSessions.slice(0, 50).map(s => ({
        patron: s.patron,
        duracion_segundos: s.duracion_segundos,
        completada: s.completada,
        created_at: s.created_at,
      }))

      return NextResponse.json({
        sessionSummary: await getSessionsSummary(),
        sessionsByTecnica: await getSessionsByTecnica(),
        sessionsByDay: await getSessionsByDay(90),
        sessionsByHour: await getSessionsByHour(),
        engagement: await getEngagementDistribution(),
        recentSessions,
      })
    }

    if (section === 'correlaciones') {
      return NextResponse.json({
        tecnicaByGenero: await getTecnicaByGenero(),
        tecnicaByEdad: await getTecnicaByEdad(),
        tecnicaByMedicacion: await getTecnicaByMedicacion(),
        completionByMedicacion: await getCompletionByMedicacion(),
        duracionByEdad: await getDuracionByEdad(),
        horasSuenoByTecnica: await getHorasSuenoByTecnica(),
        medicacionByHorasSueno: await getMedicacionByHorasSueno(),
      })
    }

    if (section === 'geo') {
      return NextResponse.json({
        byCountry: await getUsersByCountry(),
        byCiudad: await getUsersByCiudad(),
        sessionsByCountry: await getSessionsByCountry(),
        geoTable: await getGeoTable(),
      })
    }

    // Default: resumen
    const allUsers = await getUsersWithStats()

    return NextResponse.json({
      summary:      await getDashboardSummary(),
      byGenero:     await getByGenero(),
      byEdad:       await getByEdad(),
      byMedicacion: await getByMedicacion(),
      byTecnica:    await getByTecnica(),
      byHoras:      await getByHoras(),
      users:        allUsers.slice(0, 200),
    })
  } catch (err: any) {
    console.error(`[stats] Error in section "${section}":`, err?.message || err)
    return NextResponse.json({ error: 'Error al obtener datos', detail: err?.message }, { status: 500 })
  }
}
