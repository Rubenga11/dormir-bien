'use client'
// app/retiros/page.tsx — Listado público de retiros
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api'
import type { Retreat } from '@/types'

function formatDateRange(inicio: string, fin: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const a = new Date(inicio + 'T00:00:00').toLocaleDateString('es-ES', opts)
  if (!fin || inicio === fin) return a
  const b = new Date(fin + 'T00:00:00').toLocaleDateString('es-ES', opts)
  return `${a} — ${b}`
}

export default function RetirosPage() {
  const [retreats, setRetreats] = useState<Retreat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/retiros'))
      .then(r => r.ok ? r.json() : [])
      .then(data => setRetreats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="stars-bg" aria-hidden="true" />
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>

      <main className="relative z-10 min-h-screen px-6 py-16 max-w-3xl mx-auto">
        <Link href="/" className="back-btn" aria-label="Volver">&#8592;</Link>

        <h1
          className="font-serif font-light text-moon text-center mb-2"
          style={{ fontSize: 'clamp(2.5rem,7vw,4rem)', letterSpacing: '0.06em' }}
        >
          Retiros
        </h1>
        <p className="text-center text-lavender text-[0.65rem] tracking-[0.3em] uppercase mb-12">
          Respiración · Meditación · Naturaleza
        </p>

        {loading && (
          <p className="text-center text-lavender/50 text-[0.72rem] mt-20">
            Cargando retiros…
          </p>
        )}

        {!loading && retreats.length === 0 && (
          <div className="text-center mt-20">
            <span className="text-5xl mb-6 block" aria-hidden="true">🧘</span>
            <p className="text-lavender text-[0.72rem] tracking-[0.2em] uppercase mb-4">
              Próximamente
            </p>
            <p className="text-star/60 text-[0.78rem] max-w-sm mx-auto leading-relaxed">
              Estamos preparando experiencias de respiración y meditación guiada en entornos únicos.
              Vuelve pronto para más información.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {retreats.map(retreat => (
            <div key={retreat.id} className="blog-card block">
              {retreat.image_url && (
                <img src={retreat.image_url} alt={retreat.title} loading="lazy" />
              )}
              <div className="blog-card-body">
                <p className="text-[0.5rem] text-lavender/50 tracking-widest uppercase mb-2">
                  {formatDateRange(retreat.fecha_inicio, retreat.fecha_fin)}
                </p>
                <h2 className="font-serif text-moon text-xl mb-2 leading-snug">{retreat.title}</h2>
                <p className="text-[0.72rem] text-star/70 leading-relaxed mb-3">{retreat.description}</p>
                <div className="flex items-center gap-4 text-[0.58rem]">
                  {retreat.price > 0 && (
                    <span className="text-accent tracking-widest">{retreat.price}&nbsp;&euro;</span>
                  )}
                  {retreat.plazas > 0 && (
                    <span className="text-lavender/60 tracking-widest">{retreat.plazas} plazas</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/" className="btn-ghost">Volver al inicio</Link>
        </div>
      </main>
    </>
  )
}
