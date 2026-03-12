'use client'
// app/admin/dashboard/page.tsx — Dashboard completo
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Tipos locales para el dashboard
interface DashData {
  summary:      { total_usuarios:number; total_sesiones:number; total_localidades:number; pct_medicacion:number; nuevos_7dias:number; sesiones_7dias:number }
  byGenero:     { genero:string; total:number; porcentaje:number }[]
  byEdad:       { edad:string; total:number }[]
  byMedicacion: { medicacion:string; total:number }[]
  byTecnica:    { tecnica_favorita:string; total:number }[]
  byHoras:      { horas_sueno:string; total:number }[]
  users:        { genero:string; edad:string; medicacion:string; localidad:string; horas_sueno:string; tecnica_favorita:string; country:string; created_at:string }[]
}

const GENERO_COLORS: Record<string,string> = {
  'Mujer':  '#c090d8',
  'Hombre': '#7090d8',
  'Otro':   '#d8c090',
}

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
function BarChart({ data }: { data: { label:string; value:number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex flex-col gap-3">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="text-[0.58rem] text-moon min-w-[110px] leading-tight">{d.label}</div>
          <div className="bar-track flex-1">
            <div className="bar-fill" style={{ width: `${Math.round(d.value / max * 100)}%` }} />
          </div>
          <div className="text-[0.56rem] text-lavender min-w-[18px] text-right">{d.value}</div>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')
  const router = useRouter()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.status === 401) { router.push('/admin/login'); return }
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportCSV = async () => {
    const res = await fetch('/api/export/csv')
    if (!res.ok) { showToast('Error al exportar'); return }
    const blob  = await res.blob()
    const url   = URL.createObjectURL(blob)
    const a     = Object.assign(document.createElement('a'), { href: url, download: `breathe_datos_${new Date().toISOString().slice(0,10)}.csv` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('CSV descargado')
  }

  const handleExportJSON = async () => {
    const res = await fetch('/api/export/json')
    if (!res.ok) { showToast('Error al exportar'); return }
    const blob  = await res.blob()
    const url   = URL.createObjectURL(blob)
    const a     = Object.assign(document.createElement('a'), { href: url, download: `breathe_datos_${new Date().toISOString().slice(0,10)}.json` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('JSON descargado')
  }

  if (loading) return (
    <div className="relative z-10 flex items-center justify-center min-h-screen">
      <div className="stars-bg" />
      <p className="text-lavender text-[0.62rem] tracking-widest">Cargando datos…</p>
    </div>
  )

  if (!data) return null

  const { summary } = data
  const pillClass = (genero: string) =>
    genero === 'Mujer' ? 'pill pill-f' : genero === 'Hombre' ? 'pill pill-m' : 'pill pill-o'
  const medicClass = (m: string) =>
    m === 'No' ? 'pill pill-n' : 'pill pill-y'

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

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { n: summary.total_usuarios,    l: 'Usuarios' },
            { n: `${summary.pct_medicacion ?? 0}%`, l: 'Toman medicación' },
            { n: summary.total_localidades, l: 'Localidades' },
            { n: summary.total_sesiones,    l: 'Sesiones' },
          ].map(({ n, l }) => (
            <div key={l} className="kpi-card">
              <span className="font-serif text-moon text-4xl block">{n}</span>
              <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">{l}</span>
            </div>
          ))}
        </div>

        {/* Nuevos 7 días */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="kpi-card">
            <span className="font-serif text-moon text-3xl block">{summary.nuevos_7dias}</span>
            <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Nuevos (7 días)</span>
          </div>
          <div className="kpi-card">
            <span className="font-serif text-moon text-3xl block">{summary.sesiones_7dias}</span>
            <span className="text-[0.52rem] tracking-widest text-lavender uppercase mt-1 block">Sesiones (7 días)</span>
          </div>
        </div>

        {/* Export */}
        <div className="flex gap-3 flex-wrap mb-5">
          {[
            { label: '⬇ CSV',  fn: handleExportCSV },
            { label: '⬇ JSON', fn: handleExportJSON },
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn} className="btn-ghost text-[0.62rem] px-5 py-2">
              {label}
            </button>
          ))}
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
                  {['#','Género','Edad','Medicación','Localidad','Horas','Técnica','Fecha'].map(h => (
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
                    <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.localidad}</td>
                    <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.horas_sueno}</td>
                    <td className="px-3 py-2.5 border-b border-white/5 text-star">{u.tecnica_favorita || '–'}</td>
                    <td className="px-3 py-2.5 border-b border-white/5 text-lavender">{(u.created_at||'').slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
