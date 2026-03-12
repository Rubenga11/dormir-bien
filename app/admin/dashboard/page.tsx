'use client'
// app/admin/dashboard/page.tsx — Dashboard completo con pestañas
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Tipos locales
type Tab = 'resumen' | 'sesiones' | 'correlaciones' | 'geo' | 'informes'

interface DashData {
  summary:      { total_usuarios:number; total_sesiones:number; total_ciudades:number; pct_medicacion:number; nuevos_7dias:number; sesiones_7dias:number; tasa_completacion:number; duracion_media:number }
  byGenero:     { genero:string; total:number; porcentaje:number }[]
  byEdad:       { edad:string; total:number }[]
  byMedicacion: { medicacion:string; total:number }[]
  byTecnica:    { tecnica_favorita:string; total:number }[]
  byHoras:      { horas_sueno:string; total:number }[]
  users:        { genero:string; edad:string; medicacion:string; ciudad:string; cp:string; horas_sueno:string; email:string|null; tecnica_favorita:string; country:string; created_at:string }[]
}

interface SessionsData {
  sessionSummary: { total:number; completadas:number; tasa_completacion:number; duracion_media:number; tiempo_total:number; hoy:number; ultimos_7d:number; ultimos_30d:number }
  sessionsByTecnica: { tecnica:string; count:number; completadas:number; tasa:number; duracion_media:number }[]
  sessionsByDay: { date:string; count:number; completed:number }[]
  sessionsByHour: { hour:number; count:number }[]
  engagement: { bucket:string; count:number }[]
  recentSessions: { patron:string; duracion_segundos:number|null; completada:boolean; created_at:string }[]
}

interface CorrelationsData {
  tecnicaByGenero: Record<string, Record<string, number>>
  tecnicaByEdad: Record<string, Record<string, number>>
  tecnicaByMedicacion: Record<string, Record<string, number>>
  completionByMedicacion: { medicacion:string; rate:number }[]
  duracionByEdad: { edad:string; avgDuration:number }[]
  horasSuenoByTecnica: Record<string, Record<string, number>>
  medicacionByHorasSueno: Record<string, Record<string, number>>
}

interface GeoData {
  byCountry: { country:string; count:number }[]
  byCiudad: { ciudad:string; count:number }[]
  sessionsByCountry: { country:string; count:number }[]
  geoTable: { ciudad:string; country:string; usuarios:number; sesiones:number; tecnica_top:string }[]
}

const GENERO_COLORS: Record<string,string> = {
  'Mujer':  '#c090d8',
  'Hombre': '#7090d8',
  'Otro':   '#d8c090',
}

const TECNICA_COLORS: Record<string,string> = {
  'Sueño Delta':    '#6366b8',
  'Sueño Profundo': '#a89ed6',
  'Adormecimiento': '#7090d8',
  'Relajación':     '#c090d8',
}

const ALL_TECNICAS = ['Sueño Delta', 'Sueño Profundo', 'Adormecimiento', 'Relajación']

// ── Donut chart SVG puro
function DonutChart({ data }: { data: { label:string; value:number }[] }) {
  const total = data.reduce((s,d) => s+d.value, 0) || 1
  let offset = 0
  const paths: string[] = []
  const R = 40

  data.forEach(d => {
    const angle = (d.value / total) * 2 * Math.PI
    const x1 = 50 + R * Math.sin(offset)
    const y1 = 50 - R * Math.cos(offset)
    offset += angle
    const x2 = 50 + R * Math.sin(offset)
    const y2 = 50 - R * Math.cos(offset)
    const largeArc = angle > Math.PI ? 1 : 0
    const color = GENERO_COLORS[d.label] || '#7b82c4'
    paths.push(`<path d="M50,50 L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}" opacity="0.85"/>`)
  })
  paths.push(`<circle cx="50" cy="50" r="22" fill="#04050c"/>`)

  return (
    <div className="flex gap-6 items-center flex-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: paths.join('') }} />
      <div className="flex flex-col gap-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-[0.6rem] text-moon">
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: GENERO_COLORS[d.label] || '#7b82c4' }} />
            {d.label}: {d.value}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bar chart horizontal
function BarChart({ data, showPercent }: { data: { label:string; value:number }[]; showPercent?: boolean }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex flex-col gap-3">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="text-[0.58rem] text-moon min-w-[110px] leading-tight">{d.label}</div>
          <div className="bar-track flex-1">
            <div className="bar-fill" style={{ width: `${Math.round(d.value / max * 100)}%` }} />
          </div>
          <div className="text-[0.56rem] text-lavender min-w-[28px] text-right">
            {showPercent ? `${d.value}%` : d.value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Line chart SVG (for temporal trends)
function LineChart({ data, height = 120 }: { data: { date:string; count:number }[]; height?: number }) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data.map(d => d.count), 1)
  const w = 500
  const h = height
  const padY = 10
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w
    const y = h - padY - ((d.count / maxVal) * (h - padY * 2))
    return `${x},${y}`
  })

  // Find non-zero points for area fill
  const areaPoints = [`0,${h}`, ...points, `${w},${h}`]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px` }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,184,.3)" />
          <stop offset="100%" stopColor="rgba(99,102,184,0)" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill="url(#lineGrad)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Stacked bar chart horizontal
function StackedBarChart({ data, allKeys }: { data: Record<string, Record<string, number>>; allKeys: string[] }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return <p className="text-[0.54rem] text-lavender">Sin datos</p>

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([label, values]) => {
        const total = Object.values(values).reduce((a, b) => a + b, 0) || 1
        return (
          <div key={label}>
            <div className="text-[0.54rem] text-moon mb-1">{label}</div>
            <div className="flex h-5 rounded overflow-hidden bg-white/5">
              {allKeys.map(key => {
                const val = values[key] || 0
                const pct = (val / total) * 100
                if (pct === 0) return null
                return (
                  <div
                    key={key}
                    style={{ width: `${pct}%`, background: TECNICA_COLORS[key] || '#7b82c4' }}
                    className="h-full transition-all duration-500"
                    title={`${key}: ${val} (${Math.round(pct)}%)`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap gap-3 mt-1">
        {allKeys.map(key => (
          <div key={key} className="flex items-center gap-1.5 text-[0.5rem] text-moon">
            <div className="w-2 h-2 rounded-full" style={{ background: TECNICA_COLORS[key] || '#7b82c4' }} />
            {key}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Heatmap grid (24h)
function HeatmapGrid({ data }: { data: { hour:number; count:number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const getIntensity = (count: number) => {
    if (count === 0) return ''
    const ratio = count / maxCount
    if (ratio <= 0.25) return 'intensity-1'
    if (ratio <= 0.5) return 'intensity-2'
    if (ratio <= 0.75) return 'intensity-3'
    return 'intensity-4'
  }

  return (
    <div>
      <div className="heatmap-grid">
        {data.map(d => (
          <div key={d.hour} className={`heatmap-cell ${getIntensity(d.count)}`} title={`${d.hour}:00 — ${d.count} sesiones`}>
            {d.count > 0 ? d.count : ''}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[0.42rem] text-lavender">
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>
    </div>
  )
}

// ── Percentage bar (stacked 100%)
function PercentageBar({ data, label }: { data: Record<string, Record<string, number>>; label?: string }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null

  const allInnerKeys = Array.from(new Set(entries.flatMap(([, v]) => Object.keys(v))))
  const colors = ['#6366b8', '#a89ed6', '#7090d8', '#c090d8', '#d8c090', '#90d8a0']

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([key, values]) => {
        const total = Object.values(values).reduce((a, b) => a + b, 0) || 1
        return (
          <div key={key}>
            <div className="text-[0.54rem] text-moon mb-1">{key}</div>
            <div className="flex h-4 rounded overflow-hidden bg-white/5">
              {allInnerKeys.map((innerKey, i) => {
                const val = values[innerKey] || 0
                const pct = (val / total) * 100
                if (pct === 0) return null
                return (
                  <div
                    key={innerKey}
                    style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                    className="h-full"
                    title={`${innerKey}: ${val} (${Math.round(pct)}%)`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap gap-3 mt-1">
        {allInnerKeys.map((key, i) => (
          <div key={key} className="flex items-center gap-1.5 text-[0.5rem] text-moon">
            <div className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            {key}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helper: format seconds to readable
function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m < 60) return sec > 0 ? `${m}m ${sec}s` : `${m}m`
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h}h ${min}m`
}

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('resumen')
  const [data, setData]       = useState<DashData | null>(null)
  const [sessionsData, setSessionsData] = useState<SessionsData | null>(null)
  const [corrData, setCorrData] = useState<CorrelationsData | null>(null)
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [toast, setToast]     = useState('')
  const [reportType, setReportType] = useState('completo')
  const router = useRouter()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const fetchSection = useCallback(async (section: string) => {
    const res = await fetch(`/api/admin/stats?section=${section}`)
    if (res.status === 401) { router.push('/admin/login'); return null }
    return res.json()
  }, [router])

  // Initial load
  useEffect(() => {
    fetchSection('resumen').then(json => {
      if (json) setData(json)
      setLoading(false)
    })
  }, [fetchSection])

  // Load tab data on demand
  useEffect(() => {
    if (tab === 'resumen' || loading) return

    if (tab === 'sesiones' && !sessionsData) {
      setTabLoading(true)
      fetchSection('sesiones').then(json => { if (json) setSessionsData(json); setTabLoading(false) })
    }
    if (tab === 'correlaciones' && !corrData) {
      setTabLoading(true)
      fetchSection('correlaciones').then(json => { if (json) setCorrData(json); setTabLoading(false) })
    }
    if (tab === 'geo' && !geoData) {
      setTabLoading(true)
      fetchSection('geo').then(json => { if (json) setGeoData(json); setTabLoading(false) })
    }
  }, [tab, loading, sessionsData, corrData, geoData, fetchSection])

  // ── Export handlers
  const handleExportCSV = async (includeSessions = false) => {
    const url = includeSessions ? '/api/export/csv?include=sessions' : '/api/export/csv'
    const res = await fetch(url)
    if (!res.ok) { showToast('Error al exportar'); return }
    const blob  = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: blobUrl, download: `breathe_datos_${new Date().toISOString().slice(0,10)}.csv` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
    showToast('CSV descargado')
  }

  const handleExportJSON = async (includeSessions = false) => {
    const url = includeSessions ? '/api/export/json?include=sessions' : '/api/export/json'
    const res = await fetch(url)
    if (!res.ok) { showToast('Error al exportar'); return }
    const blob  = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: blobUrl, download: `breathe_datos_${new Date().toISOString().slice(0,10)}.json` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
    showToast('JSON descargado')
  }

  const handleExportReport = async (format: 'csv' | 'json') => {
    const res = await fetch(`/api/export/report?type=${reportType}&format=${format}`)
    if (!res.ok) { showToast('Error al exportar'); return }
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const ext = format === 'csv' ? 'csv' : 'json'
    const a = Object.assign(document.createElement('a'), { href: blobUrl, download: `breathe_informe_${reportType}_${new Date().toISOString().slice(0,10)}.${ext}` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
    showToast(`Informe ${reportType} (${format.toUpperCase()}) descargado`)
  }

  const handlePrint = () => { window.print() }

  // ── Loading state
  if (loading) return (
    <div className="relative z-10 flex items-center justify-center min-h-screen">
      <div className="stars-bg" />
      <p className="text-lavender text-[0.62rem] tracking-widest">Cargando datos...</p>
    </div>
  )

  if (!data) return null

  const { summary } = data
  const pillClass = (genero: string) =>
    genero === 'Mujer' ? 'pill pill-f' : genero === 'Hombre' ? 'pill pill-m' : 'pill pill-o'
  const medicClass = (m: string) =>
    m === 'No' ? 'pill pill-n' : 'pill pill-y'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'sesiones', label: 'Sesiones' },
    { id: 'correlaciones', label: 'Correlaciones' },
    { id: 'geo', label: 'Geográfico' },
    { id: 'informes', label: 'Informes' },
  ]

  return (
    <>
      <div className="stars-bg" />
      <div className="aurora-bg"><div className="aurora-blob a1"/><div className="aurora-blob a2"/></div>

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-light text-moon text-3xl">Dashboard</h2>
          <span className="text-[0.52rem] tracking-widest bg-glow/20 border border-glow/35 text-accent px-3 py-1 rounded-full uppercase">
            Breathe · Admin
          </span>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab loading indicator */}
        {tabLoading && (
          <div className="text-center py-8">
            <p className="text-lavender text-[0.58rem] tracking-widest">Cargando...</p>
          </div>
        )}

        {/* ═══════════════════════════════════
            TAB: RESUMEN
            ═══════════════════════════════════ */}
        {tab === 'resumen' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { n: summary.total_usuarios,    l: 'Usuarios' },
                { n: `${summary.pct_medicacion ?? 0}%`, l: 'Toman medicación' },
                { n: summary.total_ciudades, l: 'Ciudades' },
                { n: summary.total_sesiones,    l: 'Sesiones' },
              ].map(({ n, l }) => (
                <div key={l} className="kpi-card">
                  <span className="font-serif text-moon text-4xl block">{n}</span>
                  <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">{l}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="kpi-card">
                <span className="font-serif text-moon text-3xl block">{summary.nuevos_7dias}</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Nuevos (7d)</span>
              </div>
              <div className="kpi-card">
                <span className="font-serif text-moon text-3xl block">{summary.sesiones_7dias}</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Sesiones (7d)</span>
              </div>
              <div className="kpi-card">
                <span className="font-serif text-moon text-3xl block">{summary.tasa_completacion}%</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Completación</span>
              </div>
              <div className="kpi-card">
                <span className="font-serif text-moon text-3xl block">{formatSeconds(summary.duracion_media)}</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Duración media</span>
              </div>
            </div>

            {/* Export */}
            <div className="flex gap-3 flex-wrap mb-5">
              <button onClick={() => handleExportCSV()} className="btn-ghost text-[0.62rem] px-5 py-2">CSV</button>
              <button onClick={() => handleExportJSON()} className="btn-ghost text-[0.62rem] px-5 py-2">JSON</button>
            </div>

            {/* Género (donut) */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Género</div>
              <DonutChart data={data.byGenero.map(d => ({ label: d.genero, value: d.total }))} />
            </div>

            {/* Medicación */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Uso de Medicación para Dormir</div>
              <BarChart data={data.byMedicacion.map(d => ({ label: d.medicacion, value: d.total }))} />
            </div>

            {/* Técnica */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Técnica de Respiración Preferida</div>
              <BarChart data={data.byTecnica.map(d => ({ label: d.tecnica_favorita, value: d.total }))} />
            </div>

            {/* Edad */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Distribución por Edad</div>
              <BarChart data={data.byEdad.map(d => ({ label: d.edad, value: d.total }))} />
            </div>

            {/* Horas de sueño */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Horas de Sueño Habituales</div>
              <BarChart data={data.byHoras.map(d => ({ label: d.horas_sueno, value: d.total }))} />
            </div>

            {/* Tabla de usuarios */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">
                Registros de Usuarios ({data.users.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.62rem] min-w-[520px]">
                  <thead>
                    <tr>
                      {['#','Género','Edad','Medicación','Ciudad','CP','Horas','Email','Técnica','Fecha'].map(h => (
                        <th key={h} className="text-left text-lavender tracking-widest text-[0.52rem] uppercase px-3 py-2 border-b border-white/10">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2.5 border-b border-white/5 text-lavender">{i+1}</td>
                        <td className="px-3 py-2.5 border-b border-white/5">
                          <span className={pillClass(u.genero)}>{u.genero}</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.edad}</td>
                        <td className="px-3 py-2.5 border-b border-white/5">
                          <span className={medicClass(u.medicacion)}>{u.medicacion}</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.ciudad}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.cp}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.horas_sueno}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.email || '–'}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.tecnica_favorita || '–'}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-lavender">{(u.created_at||'').slice(0,10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════
            TAB: SESIONES
            ═══════════════════════════════════ */}
        {tab === 'sesiones' && sessionsData && !tabLoading && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="kpi-card">
                <span className="font-serif text-moon text-4xl block">{sessionsData.sessionSummary.total}</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Total sesiones</span>
              </div>
              <div className="kpi-card">
                <span className="font-serif text-moon text-4xl block">{sessionsData.sessionSummary.tasa_completacion}%</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Completación</span>
              </div>
              <div className="kpi-card">
                <span className="font-serif text-moon text-4xl block">{formatSeconds(sessionsData.sessionSummary.duracion_media)}</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Duración media</span>
              </div>
              <div className="kpi-card">
                <span className="font-serif text-moon text-4xl block">{formatSeconds(sessionsData.sessionSummary.tiempo_total)}</span>
                <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Tiempo total</span>
              </div>
            </div>

            {/* Sessions over time */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Sesiones en el Tiempo (90 días)</div>
              <LineChart data={sessionsData.sessionsByDay} />
              <div className="flex justify-between mt-2 text-[0.42rem] text-lavender">
                <span>{sessionsData.sessionsByDay[0]?.date}</span>
                <span>{sessionsData.sessionsByDay[sessionsData.sessionsByDay.length - 1]?.date}</span>
              </div>
            </div>

            {/* Sessions by technique */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Sesiones por Técnica</div>
              {sessionsData.sessionsByTecnica.map(t => (
                <div key={t.tecnica} className="mb-3">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-[0.58rem] text-moon min-w-[130px]">{t.tecnica}</div>
                    <div className="bar-track flex-1">
                      <div className="bar-fill" style={{
                        width: `${Math.round(t.count / Math.max(...sessionsData.sessionsByTecnica.map(x => x.count), 1) * 100)}%`,
                        background: TECNICA_COLORS[t.tecnica] || 'var(--glow)'
                      }} />
                    </div>
                    <div className="text-[0.5rem] text-lavender min-w-[80px] text-right">
                      {t.count} ses · {t.tasa}% comp
                    </div>
                  </div>
                </div>
              ))}
              {(() => {
                const topTecnica = sessionsData.sessionsByTecnica[0]
                return topTecnica ? (
                  <p className="chart-subtitle">
                    La técnica más usada es <strong className="text-accent">{topTecnica.tecnica}</strong> con {topTecnica.count} sesiones
                    y una tasa de completación del {topTecnica.tasa}%.
                  </p>
                ) : null
              })()}
            </div>

            {/* Usage by hour */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Uso por Hora del Día</div>
              <HeatmapGrid data={sessionsData.sessionsByHour} />
              {(() => {
                const peakHour = sessionsData.sessionsByHour.reduce((a, b) => b.count > a.count ? b : a, sessionsData.sessionsByHour[0])
                return peakHour && peakHour.count > 0 ? (
                  <p className="chart-subtitle">
                    Hora pico: <strong className="text-accent">{peakHour.hour}:00</strong> con {peakHour.count} sesiones.
                    {peakHour.hour >= 18 ? ' Los usuarios prefieren practicar por la noche.' :
                     peakHour.hour >= 6 && peakHour.hour < 12 ? ' Los usuarios prefieren practicar por la mañana.' : ''}
                  </p>
                ) : null
              })()}
            </div>

            {/* Engagement distribution */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Distribución de Engagement</div>
              <BarChart data={sessionsData.engagement.map(d => ({ label: `${d.bucket} sesiones`, value: d.count }))} />
              <p className="chart-subtitle">Número de usuarios agrupados por cantidad de sesiones realizadas.</p>
            </div>

            {/* Recent sessions table */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">
                Sesiones Recientes ({sessionsData.recentSessions.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.62rem] min-w-[400px]">
                  <thead>
                    <tr>
                      {['#','Técnica','Duración','Completada','Fecha'].map(h => (
                        <th key={h} className="text-left text-lavender tracking-widest text-[0.52rem] uppercase px-3 py-2 border-b border-white/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsData.recentSessions.map((s, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2.5 border-b border-white/5 text-lavender">{i+1}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{s.patron}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{s.duracion_segundos ? formatSeconds(s.duracion_segundos) : '–'}</td>
                        <td className="px-3 py-2.5 border-b border-white/5">
                          <span className={s.completada ? 'pill pill-y' : 'pill pill-n'}>{s.completada ? 'Sí' : 'No'}</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-lavender">{s.created_at.slice(0,16).replace('T',' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════
            TAB: CORRELACIONES
            ═══════════════════════════════════ */}
        {tab === 'correlaciones' && corrData && !tabLoading && (
          <>
            {/* Technique by gender */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Preferencia de Técnica por Género</div>
              <StackedBarChart data={corrData.tecnicaByGenero} allKeys={ALL_TECNICAS} />
              {(() => {
                const entries = Object.entries(corrData.tecnicaByGenero)
                const insights = entries.map(([genero, tecnicas]) => {
                  const top = Object.entries(tecnicas).sort((a, b) => b[1] - a[1])[0]
                  return top ? `${genero}: ${top[0]}` : null
                }).filter(Boolean)
                return insights.length > 0 ? (
                  <p className="chart-subtitle">Técnica preferida — {insights.join(' · ')}</p>
                ) : null
              })()}
            </div>

            {/* Technique by age */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Preferencia de Técnica por Edad</div>
              <StackedBarChart data={corrData.tecnicaByEdad} allKeys={ALL_TECNICAS} />
            </div>

            {/* Technique by medication */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Preferencia de Técnica por Medicación</div>
              <StackedBarChart data={corrData.tecnicaByMedicacion} allKeys={ALL_TECNICAS} />
              {(() => {
                const medData = corrData.tecnicaByMedicacion['Sí, habitualmente']
                if (!medData) return null
                const topMed = Object.entries(medData).sort((a, b) => b[1] - a[1])[0]
                return topMed ? (
                  <p className="chart-subtitle">
                    Los usuarios con medicación habitual prefieren <strong className="text-accent">{topMed[0]}</strong>.
                  </p>
                ) : null
              })()}
            </div>

            {/* Completion by medication */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Tasa de Completación por Medicación</div>
              <BarChart data={corrData.completionByMedicacion.map(d => ({ label: d.medicacion, value: d.rate }))} showPercent />
              {(() => {
                const sorted = [...corrData.completionByMedicacion].sort((a, b) => b.rate - a.rate)
                const top = sorted[0]
                const bottom = sorted[sorted.length - 1]
                return top && bottom && top.medicacion !== bottom.medicacion ? (
                  <p className="chart-subtitle">
                    Mayor completación: <strong className="text-accent">{top.medicacion}</strong> ({top.rate}%) vs {bottom.medicacion} ({bottom.rate}%).
                  </p>
                ) : null
              })()}
            </div>

            {/* Duration by age */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Duración Media por Grupo de Edad</div>
              <BarChart data={corrData.duracionByEdad.map(d => ({ label: d.edad, value: Math.round(d.avgDuration / 60) }))} />
              <p className="chart-subtitle">Duración media de sesiones en minutos por grupo de edad.</p>
            </div>

            {/* Sleep hours by technique */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Horas de Sueño por Técnica Usada</div>
              <PercentageBar data={corrData.horasSuenoByTecnica} />
            </div>

            {/* Medication by sleep hours */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Uso de Medicación por Horas de Sueño</div>
              <PercentageBar data={corrData.medicacionByHorasSueno} />
              {(() => {
                const low = corrData.medicacionByHorasSueno['Menos de 5h'] || corrData.medicacionByHorasSueno['5–6h']
                if (!low) return null
                const medCount = low['Sí, habitualmente'] || 0
                const total = Object.values(low).reduce((a, b) => a + b, 0) || 1
                const pct = Math.round(medCount * 100 / total)
                return pct > 0 ? (
                  <p className="chart-subtitle">
                    El <strong className="text-accent">{pct}%</strong> de los usuarios que duermen menos toman medicación habitualmente.
                  </p>
                ) : null
              })()}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════
            TAB: GEOGRÁFICO
            ═══════════════════════════════════ */}
        {tab === 'geo' && geoData && !tabLoading && (
          <>
            {/* Users by country */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Usuarios por País</div>
              <BarChart data={geoData.byCountry.map(d => ({ label: d.country, value: d.count }))} />
            </div>

            {/* Users by city */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Usuarios por Ciudad (Top 15)</div>
              <BarChart data={geoData.byCiudad.slice(0, 15).map(d => ({ label: d.ciudad, value: d.count }))} />
            </div>

            {/* Sessions by country */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Sesiones por País</div>
              <BarChart data={geoData.sessionsByCountry.map(d => ({ label: d.country, value: d.count }))} />
            </div>

            {/* City table */}
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">
                Detalle por Ciudad ({geoData.geoTable.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.62rem] min-w-[480px]">
                  <thead>
                    <tr>
                      {['Ciudad','País','Usuarios','Sesiones','Técnica Top'].map(h => (
                        <th key={h} className="text-left text-lavender tracking-widest text-[0.52rem] uppercase px-3 py-2 border-b border-white/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {geoData.geoTable.map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{row.ciudad}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-lavender">{row.country}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{row.usuarios}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{row.sesiones}</td>
                        <td className="px-3 py-2.5 border-b border-white/5 text-star">{row.tecnica_top}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════
            TAB: INFORMES
            ═══════════════════════════════════ */}
        {tab === 'informes' && (
          <>
            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Tipo de Informe</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: 'completo', label: 'Completo' },
                  { id: 'clinico', label: 'Clínico' },
                  { id: 'engagement', label: 'Engagement' },
                  { id: 'demografico', label: 'Demográfico' },
                ].map(r => (
                  <label key={r.id} className="radio-pill">
                    <input
                      type="radio"
                      name="report-type"
                      value={r.id}
                      checked={reportType === r.id}
                      onChange={() => setReportType(r.id)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>

              <div className="text-[0.54rem] text-moon mb-4 leading-relaxed">
                {reportType === 'completo' && 'Incluye todas las métricas: usuarios, sesiones, correlaciones y geografía.'}
                {reportType === 'clinico' && 'Enfocado en medicación, correlaciones sueño-técnica y duración por edad. Ideal para profesionales sanitarios.'}
                {reportType === 'engagement' && 'Sesiones, retención, tasas de completación y engagement. Ideal para empresas de bienestar.'}
                {reportType === 'demografico' && 'Desglose por género, edad y geografía. Ideal para investigadores.'}
              </div>
            </div>

            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Exportar</div>
              <div className="flex gap-3 flex-wrap mb-4">
                <button onClick={() => handleExportReport('csv')} className="btn-ghost text-[0.62rem] px-5 py-2">
                  Informe CSV
                </button>
                <button onClick={() => handleExportReport('json')} className="btn-ghost text-[0.62rem] px-5 py-2">
                  Informe JSON
                </button>
                <button onClick={handlePrint} className="btn-ghost text-[0.62rem] px-5 py-2">
                  Imprimir
                </button>
              </div>
            </div>

            <div className="chart-box">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-4">Exportación de Datos Crudos</div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => handleExportCSV(true)} className="btn-ghost text-[0.62rem] px-5 py-2">
                  CSV (con sesiones)
                </button>
                <button onClick={() => handleExportJSON(true)} className="btn-ghost text-[0.62rem] px-5 py-2">
                  JSON (con sesiones)
                </button>
                <button onClick={() => handleExportCSV(false)} className="btn-ghost text-[0.62rem] px-5 py-2">
                  CSV (solo usuarios)
                </button>
                <button onClick={() => handleExportJSON(false)} className="btn-ghost text-[0.62rem] px-5 py-2">
                  JSON (solo usuarios)
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
