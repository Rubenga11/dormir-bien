// app/api/export/report/route.ts — Informes tipificados
import { NextRequest, NextResponse } from 'next/server'
import {
  getDashboardSummary, getByGenero, getByEdad, getByMedicacion, getByTecnica, getByHoras,
  getSessionsSummary, getSessionsByTecnica, getEngagementDistribution,
  getTecnicaByGenero, getTecnicaByEdad, getTecnicaByMedicacion,
  getCompletionByMedicacion, getDuracionByEdad, getHorasSuenoByTecnica, getMedicacionByHorasSueno,
  getUsersByCountry, getUsersByCiudad, getSessionsByCountry,
} from '@/lib/db'

function authCheck(req: NextRequest): boolean {
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}

async function buildReport(type: string) {
  switch (type) {
    case 'clinico':
      return {
        tipo: 'Clínico',
        medicacion: await getByMedicacion(),
        completionByMedicacion: await getCompletionByMedicacion(),
        horasSuenoByTecnica: await getHorasSuenoByTecnica(),
        medicacionByHorasSueno: await getMedicacionByHorasSueno(),
        duracionByEdad: await getDuracionByEdad(),
      }
    case 'engagement':
      return {
        tipo: 'Engagement',
        sessions: await getSessionsSummary(),
        sessionsByTecnica: await getSessionsByTecnica(),
        engagement: await getEngagementDistribution(),
        completionByMedicacion: await getCompletionByMedicacion(),
      }
    case 'demografico':
      return {
        tipo: 'Demográfico',
        genero: await getByGenero(),
        edad: await getByEdad(),
        byCountry: await getUsersByCountry(),
        byCiudad: await getUsersByCiudad(),
        sessionsByCountry: await getSessionsByCountry(),
      }
    default: // completo
      return {
        tipo: 'Completo',
        summary: await getDashboardSummary(),
        genero: await getByGenero(),
        edad: await getByEdad(),
        medicacion: await getByMedicacion(),
        tecnica: await getByTecnica(),
        horas: await getByHoras(),
        sessions: await getSessionsSummary(),
        sessionsByTecnica: await getSessionsByTecnica(),
        engagement: await getEngagementDistribution(),
        tecnicaByGenero: await getTecnicaByGenero(),
        tecnicaByEdad: await getTecnicaByEdad(),
        tecnicaByMedicacion: await getTecnicaByMedicacion(),
        completionByMedicacion: await getCompletionByMedicacion(),
        duracionByEdad: await getDuracionByEdad(),
        horasSuenoByTecnica: await getHorasSuenoByTecnica(),
        medicacionByHorasSueno: await getMedicacionByHorasSueno(),
        byCountry: await getUsersByCountry(),
        byCiudad: await getUsersByCiudad(),
        sessionsByCountry: await getSessionsByCountry(),
      }
  }
}

function reportToCSV(report: Record<string, unknown>): string {
  const lines: string[] = ['\uFEFF'] // BOM for Excel
  for (const [section, data] of Object.entries(report)) {
    if (typeof data === 'string') {
      lines.push(`${section},${data}`)
      continue
    }
    lines.push(`\n# ${section}`)
    if (Array.isArray(data)) {
      if (data.length > 0) {
        lines.push(Object.keys(data[0]).join(','))
        for (const row of data) {
          lines.push(Object.values(row as Record<string, unknown>).map(v =>
            typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v)
          ).join(','))
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'object' && v !== null) {
          lines.push(`${k},${Object.entries(v).map(([k2, v2]) => `${k2}:${v2}`).join(',')}`)
        } else {
          lines.push(`${k},${v}`)
        }
      }
    }
  }
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type') || 'completo'
  const format = req.nextUrl.searchParams.get('format') || 'json'
  const report = await buildReport(type)
  const date = new Date().toISOString().slice(0, 10)

  if (format === 'csv') {
    return new NextResponse(reportToCSV(report), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="breathe_informe_${type}_${date}.csv"`,
      },
    })
  }

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="breathe_informe_${type}_${date}.json"`,
    },
  })
}
