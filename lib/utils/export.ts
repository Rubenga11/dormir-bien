// lib/utils/export.ts
import type { UserRecord } from '@/types'

export function toCSV(users: UserRecord[]): string {
  const BOM = '\uFEFF'
  const headers = ['Género','Edad','Medicación','Ciudad','CP','Horas Sueño','Técnica','País','Fecha']
  const rows = users.map(u => [
    u.genero,
    u.edad,
    u.medicacion,
    `"${u.ciudad.replace(/"/g, '""')}"`,
    u.cp,
    u.horas_sueno,
    u.tecnica_favorita || '–',
    u.country || '–',
    u.created_at.slice(0, 10),
  ].join(','))
  return BOM + [headers.join(','), ...rows].join('\n')
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadCSV(users: UserRecord[]) {
  downloadBlob(toCSV(users), `breathe_datos_${today()}.csv`, 'text/csv;charset=utf-8;')
}

export function downloadJSON(users: UserRecord[]) {
  const clean = users.map(({ id: _id, ...rest }) => rest)
  downloadBlob(JSON.stringify(clean, null, 2), `breathe_datos_${today()}.json`, 'application/json')
}

const today = () => new Date().toISOString().slice(0, 10)
