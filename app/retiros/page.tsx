'use client'
// app/retiros/page.tsx — Listado público de retiros con inscripción
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api'
import type { Retreat } from '@/types'

interface RetreatWithPlazas extends Retreat {
  plazas_disponibles: number | null
}

function formatDateRange(inicio: string, fin: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const a = new Date(inicio + 'T00:00:00').toLocaleDateString('es-ES', opts)
  if (!fin || inicio === fin) return a
  const b = new Date(fin + 'T00:00:00').toLocaleDateString('es-ES', opts)
  return `${a} — ${b}`
}

export default function RetirosPage() {
  const [retreats, setRetreats] = useState<RetreatWithPlazas[]>([])
  const [loading, setLoading] = useState(true)
  const [registeredIds, setRegisteredIds] = useState<string[]>([])
  const [selectedRetreat, setSelectedRetreat] = useState<RetreatWithPlazas | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const fetchRetreats = () => {
    fetch(apiUrl('/api/retiros'))
      .then(r => r.ok ? r.json() : [])
      .then(data => setRetreats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRetreats()
    const uid = localStorage.getItem('breathe_uid')
    if (uid) {
      fetch(apiUrl(`/api/retiros/mis-inscripciones?userId=${uid}`))
        .then(r => r.ok ? r.json() : [])
        .then(ids => setRegisteredIds(ids))
        .catch(() => {})
    }
  }, [])

  const handleRegisterClick = (retreat: RetreatWithPlazas) => {
    setSelectedRetreat(retreat)
  }

  const handleFormRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRetreat) return
    setSubmitting(true)

    const fd = new FormData(e.currentTarget)
    const uid = localStorage.getItem('breathe_uid')
    const body: Record<string, string | undefined> = {
      retreatId: selectedRetreat.id,
      nombre: (fd.get('nombre') as string).trim(),
      apellidos: (fd.get('apellidos') as string).trim(),
      email: (fd.get('email') as string).trim(),
      telefono: (fd.get('telefono') as string).trim(),
    }
    if (uid) body.userId = uid

    try {
      const res = await fetch(apiUrl('/api/retiros/registro'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.userId) localStorage.setItem('breathe_uid', data.userId)
        setRegisteredIds(prev => [...prev, selectedRetreat.id])
        setSelectedRetreat(null)
        fetchRetreats()
        showToast('Inscripción confirmada')
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Error al inscribirse')
      }
    } catch { showToast('Error de conexión') }
    setSubmitting(false)
  }

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
          {retreats.map(retreat => {
            const isRegistered = registeredIds.includes(retreat.id)
            const isFull = retreat.plazas_disponibles !== null && retreat.plazas_disponibles <= 0

            return (
              <div key={retreat.id} className="blog-card block">
                {retreat.image_url && (
                  <img src={retreat.image_url} alt={retreat.title} loading="lazy" />
                )}
                <div className="blog-card-body">
                  <p className="text-[0.5rem] text-lavender/50 tracking-widest uppercase mb-2">
                    {formatDateRange(retreat.fecha_inicio, retreat.fecha_fin)}
                  </p>
                  {retreat.ubicacion && (
                    <p className="text-[0.5rem] text-lavender/70 tracking-widest uppercase mb-2">
                      📍 {retreat.ubicacion}
                    </p>
                  )}
                  <h2 className="font-serif text-moon text-xl mb-2 leading-snug">{retreat.title}</h2>
                  <p className="text-[0.72rem] text-star/70 leading-relaxed mb-3">{retreat.description}</p>
                  <div className="flex items-center gap-4 text-[0.58rem] mb-3">
                    {retreat.price > 0 && (
                      <span className="text-accent tracking-widest">{retreat.price}&nbsp;&euro;</span>
                    )}
                    {retreat.plazas > 0 && retreat.plazas_disponibles !== null && (
                      <span className="text-lavender/60 tracking-widest">
                        {retreat.plazas_disponibles} / {retreat.plazas} plazas
                      </span>
                    )}
                  </div>

                  {isRegistered ? (
                    <span className="inline-block text-[0.56rem] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Inscrito
                    </span>
                  ) : isFull ? (
                    <span className="inline-block text-[0.56rem] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-400/30">
                      Completo
                    </span>
                  ) : (
                    <button
                      className="btn-primary text-[0.58rem] px-6 py-2"
                      disabled={submitting}
                      onClick={() => handleRegisterClick(retreat)}
                    >
                      {submitting ? 'Procesando…' : 'Inscribirse'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Registration form modal — always shown, contact fields only */}
        {selectedRetreat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="chart-box w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="text-[0.56rem] tracking-[0.28em] uppercase text-lavender mb-1">
                Inscripción
              </div>
              <h3 className="font-serif text-moon text-lg mb-4">{selectedRetreat.title}</h3>
              <p className="text-[0.68rem] text-star/60 mb-4">
                Introduce tus datos de contacto para reservar tu plaza
              </p>

              <form onSubmit={handleFormRegister} className="flex flex-col gap-3">
                <div>
                  <label className="text-[0.52rem] text-lavender tracking-widest uppercase">Nombre</label>
                  <input name="nombre" className="form-input" required placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="text-[0.52rem] text-lavender tracking-widest uppercase">Apellidos</label>
                  <input name="apellidos" className="form-input" required placeholder="Tus apellidos" />
                </div>
                <div>
                  <label className="text-[0.52rem] text-lavender tracking-widest uppercase">Email</label>
                  <input name="email" type="email" className="form-input" required placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="text-[0.52rem] text-lavender tracking-widest uppercase">Teléfono</label>
                  <input name="telefono" type="tel" className="form-input" required placeholder="+34 600 000 000" />
                </div>

                <div className="flex gap-2 mt-2">
                  <button type="submit" className="btn-primary text-[0.58rem] px-6 py-2" disabled={submitting}>
                    {submitting ? 'Procesando…' : 'Confirmar inscripción'}
                  </button>
                  <button type="button" className="btn-ghost text-[0.58rem] px-4 py-2" onClick={() => setSelectedRetreat(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="text-center mt-16">
          <Link href="/" className="btn-ghost">Volver al inicio</Link>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-moon text-[0.68rem] tracking-wide shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}
