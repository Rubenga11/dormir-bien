'use client'
// app/app/page.tsx — La app de respiración (SPA client-side)
// Maneja: registro → selector → audio-gate → sesión
// Perfil persistente en localStorage con opción de editar

import { useState, useEffect, useRef, useCallback } from 'react'
import { BREATH_PATTERNS } from '@/lib/constants/patterns'
import { CONTENT } from '@/lib/constants/content'
import type { BreathPattern } from '@/types'
import { useBreathEngine } from '@/hooks/useBreathEngine'
import { useWakeLock } from '@/hooks/useWakeLock'

// ── LocalStorage keys
const LS_PROFILE = 'breathe_profile'  // perfil completo del usuario
const LS_UID     = 'breathe_uid'      // UUID del usuario (devuelto por la API)

type Screen = 'selector' | 'registro' | 'audio-gate' | 'session'

interface UserProfile {
  genero: string
  edad: string
  medicacion: string
  localidad: string
  horas_sueno: string
}

function getSavedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_PROFILE)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function AppPage() {
  const [screen, setScreen] = useState<Screen>('registro')
  const [selectedPattern, setSelectedPattern] = useState<BreathPattern | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const [toast, setToast] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { state: engineState, start, stop, togglePause, phaseLabel } = useBreathEngine()
  const { acquire: acquireWakeLock, release: releaseWakeLock } = useWakeLock()

  // Comprobar perfil previo al montar
  useEffect(() => {
    const profile = getSavedProfile()
    if (profile) {
      setScreen('selector')
      setForm(profile)
    } else {
      setScreen('registro')
    }
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }, [])

  // ── FORMULARIO ──
  const [form, setForm] = useState<UserProfile>({
    genero: '', edad: '', medicacion: '', localidad: '', horas_sueno: ''
  })

  const handleRegistro = async () => {
    const { genero, edad, medicacion, localidad, horas_sueno } = form
    if (!genero || !edad || !medicacion || !localidad.trim() || !horas_sueno) {
      showToast('Completa todos los campos')
      return
    }

    const profileData: UserProfile = { genero, edad, medicacion, localidad: localidad.trim(), horas_sueno }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      const data = await res.json()
      if (data.id) localStorage.setItem(LS_UID, data.id)
    } catch {
      // Falla silenciosamente — el usuario puede seguir usando la app
    }

    localStorage.setItem(LS_PROFILE, JSON.stringify(profileData))
    showToast('Listo \u00b7 elige tu ritmo')
    setTimeout(() => setScreen('selector'), 900)
  }

  // ── ACTUALIZAR PERFIL ──
  const handleUpdateProfile = async () => {
    const { genero, edad, medicacion, localidad, horas_sueno } = form
    if (!genero || !edad || !medicacion || !localidad.trim() || !horas_sueno) {
      showToast('Completa todos los campos')
      return
    }

    const profileData: UserProfile = { genero, edad, medicacion, localidad: localidad.trim(), horas_sueno }
    const uid = localStorage.getItem(LS_UID)

    if (uid) {
      try {
        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, ...profileData }),
        })
      } catch {
        // Falla silenciosamente
      }
    }

    localStorage.setItem(LS_PROFILE, JSON.stringify(profileData))
    setEditingProfile(false)
    showToast('Perfil actualizado')
  }

  // ── SELECCIÓN DE PATRÓN ──
  const handleSelectPattern = (pattern: BreathPattern) => {
    setSelectedPattern(pattern)
    setScreen('audio-gate')
  }

  // ── INICIAR SESIÓN ──
  const handleActivate = () => {
    if (!selectedPattern) return
    setScreen('session')
    acquireWakeLock()

    const uid = localStorage.getItem(LS_UID)
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:  uid,
        patron:  selectedPattern.nombre,
        completada: false,
      }),
    }).catch(() => {})

    start(selectedPattern)
  }

  // ── SALIR DE SESIÓN ──
  const handleExit = () => {
    stop()
    releaseWakeLock()
    setHintVisible(false)
    setScreen('selector')
  }

  // ── MOSTRAR CONTROLES AL TOCAR ──
  const handleSessionTouch = () => {
    if (screen !== 'session') return
    setHintVisible(true)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(() => setHintVisible(false), 3000)
  }

  const handleBack = () => {
    if (screen === 'audio-gate') setScreen('selector')
  }

  // Fase actual del orbe
  const orbScale = engineState.currentPhase === 'inhale' ? 1.45
    : engineState.currentPhase === 'exhale' ? 0.75 : 1
  const orbEasing = engineState.currentPhase === 'inhale'
    ? 'cubic-bezier(0.2,0,0.05,1)' : 'cubic-bezier(0.05,0,0.2,1)'
  const orbDuration = engineState.currentPhase === 'inhale'
    ? (selectedPattern?.inhala ?? 4)
    : engineState.currentPhase === 'exhale'
    ? (selectedPattern?.exhala ?? 8) : 2.5

  const { registro, gate } = CONTENT

  // ── Determinar si es usuario recurrente
  const isReturningUser = getSavedProfile() !== null

  // ── Formulario reutilizable (registro y edición)
  const renderForm = (mode: 'registro' | 'editar') => (
    <div className="glass-card w-full max-w-md p-8">
      {/* Género */}
      <div className="mb-5">
        <label className="block text-[0.58rem] tracking-[0.28em] uppercase text-lavender mb-2">
          {registro.fields.genero}
        </label>
        <div className="flex gap-2 flex-wrap">
          {registro.options.genero.map(v => (
            <label key={v} className="radio-pill">
              <input type="radio" name="genero" value={v}
                checked={form.genero === v}
                onChange={() => setForm(f => ({ ...f, genero: v }))} />
              <span>{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Edad */}
      <div className="mb-5">
        <label className="block text-[0.58rem] tracking-[0.28em] uppercase text-lavender mb-2">
          {registro.fields.edad}
        </label>
        <div className="flex gap-2 flex-wrap">
          {registro.options.edad.map(v => (
            <label key={v} className="radio-pill">
              <input type="radio" name="edad" value={v}
                checked={form.edad === v}
                onChange={() => setForm(f => ({ ...f, edad: v }))} />
              <span>{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Medicación */}
      <div className="mb-5">
        <label className="block text-[0.58rem] tracking-[0.28em] uppercase text-lavender mb-2">
          {registro.fields.medicacion}
        </label>
        <div className="flex gap-2 flex-wrap">
          {registro.options.medicacion.map(v => (
            <label key={v} className="radio-pill">
              <input type="radio" name="medicacion" value={v}
                checked={form.medicacion === v}
                onChange={() => setForm(f => ({ ...f, medicacion: v }))} />
              <span>{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Localidad */}
      <div className="mb-5">
        <label className="block text-[0.58rem] tracking-[0.28em] uppercase text-lavender mb-2">
          {registro.fields.localidad}
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="ej. Madrid, Barcelona\u2026"
          value={form.localidad}
          onChange={e => setForm(f => ({ ...f, localidad: e.target.value }))}
        />
      </div>

      {/* Horas de sueño */}
      <div className="mb-6">
        <label className="block text-[0.58rem] tracking-[0.28em] uppercase text-lavender mb-2">
          {registro.fields.horas}
        </label>
        <select
          className="form-input"
          value={form.horas_sueno}
          onChange={e => setForm(f => ({ ...f, horas_sueno: e.target.value }))}
        >
          <option value="">\u2014 Selecciona \u2014</option>
          {registro.options.horas.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      {mode === 'registro' ? (
        <button className="btn-primary w-full" onClick={handleRegistro}>
          {registro.cta}
        </button>
      ) : (
        <div className="flex gap-3">
          <button className="btn-primary flex-1" onClick={handleUpdateProfile}>
            Actualizar
          </button>
          <button className="btn-ghost flex-1" onClick={() => setEditingProfile(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div
      className={`relative min-h-screen ${screen === 'session' ? 'session-screen' : ''} ${
        screen === 'session' ? `phase-${engineState.currentPhase}` : ''
      }`}
      onTouchStart={handleSessionTouch}
      onClick={screen === 'session' ? handleSessionTouch : undefined}
    >
      {/* Fondo */}
      <div className={`stars-bg ${screen === 'session' ? 'hidden' : ''}`} aria-hidden="true" />
      <div className="aurora-bg" aria-hidden="true">
        <div className={`aurora-blob a1 ${screen === 'session' ? 'dimmed' : ''}`} />
        <div className={`aurora-blob a2 ${screen === 'session' ? 'dimmed' : ''}`} />
      </div>

      {/* ══════════════════════════════════
          REGISTRO (primera vez)
          ══════════════════════════════════ */}
      {screen === 'registro' && (
        <div className="relative z-10 flex flex-col items-center min-h-screen px-6 py-10">
          <div className="text-center mb-8 pt-4 w-full">
            <h2 className="font-serif font-light text-moon text-3xl tracking-wide">{registro.title}</h2>
            <p className="text-[0.58rem] text-lavender tracking-widest mt-1">{registro.subtitle}</p>
          </div>
          {renderForm('registro')}
        </div>
      )}

      {/* ══════════════════════════════════
          SELECTOR DE PATRONES
          ══════════════════════════════════ */}
      {screen === 'selector' && !editingProfile && (
        <div className="relative z-10 flex flex-col items-center min-h-screen px-6 py-10">
          {/* Botón editar perfil */}
          <button
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full border border-lavender/20 flex items-center justify-center text-lavender/50 hover:text-lavender hover:border-lavender/40 transition-all"
            onClick={() => setEditingProfile(true)}
            title="Editar perfil"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>

          <div className="text-center mb-8 pt-4 w-full">
            <h2 className="font-serif font-light text-moon text-3xl">
              {isReturningUser ? 'Buenas noches' : 'Elige tu ritmo'}
            </h2>
            <p className="text-[0.58rem] text-lavender tracking-wider leading-loose mt-2">
              Empieza por el nivel 1 &middot; el m&aacute;s lento<br />
              Sube un nivel si sientes que te falta el aire<br />
              Cuanto m&aacute;s lento, m&aacute;s profundo el sue&ntilde;o que imitas
            </p>
          </div>

          <div className="w-full max-w-lg flex flex-col gap-3">
            {BREATH_PATTERNS.map(pattern => (
              <button
                key={pattern.id}
                className="breath-card text-left"
                onClick={() => handleSelectPattern(pattern)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: pattern.color }}
                  aria-hidden="true"
                >
                  {pattern.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-[0.52rem] text-lavender/50 tracking-widest uppercase mb-0.5">
                    Nivel {pattern.nivel}{pattern.nivel === 1 ? ' \u00b7 m\u00e1s lento' : pattern.nivel === 4 ? ' \u00b7 si sientes falta de aire' : ''}
                  </div>
                  <div className="font-serif text-moon text-xl mb-0.5">{pattern.nombre}</div>
                  <div className="text-[0.58rem] text-lavender leading-relaxed">{pattern.descripcion}</div>
                </div>
                <div className="text-right flex-shrink-0 text-[0.54rem] text-accent tracking-widest">
                  <span className="block font-serif text-moon text-2xl">{Math.round(pattern.rpm)}</span>
                  resp/min
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          EDITAR PERFIL (overlay sobre selector)
          ══════════════════════════════════ */}
      {screen === 'selector' && editingProfile && (
        <div className="relative z-10 flex flex-col items-center min-h-screen px-6 py-10">
          <div className="text-center mb-8 pt-4 w-full">
            <h2 className="font-serif font-light text-moon text-3xl tracking-wide">Editar perfil</h2>
            <p className="text-[0.58rem] text-lavender tracking-widest mt-1">Actualiza tus datos</p>
          </div>
          {renderForm('editar')}
        </div>
      )}

      {/* ══════════════════════════════════
          AUDIO GATE
          ══════════════════════════════════ */}
      {screen === 'audio-gate' && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-10 text-center gap-7"
          style={{ background: '#04050c' }}>
          <span className="text-5xl" style={{ animation: 'moonFloat 5s ease-in-out infinite' }}>🌙</span>
          <h2 className="font-serif font-light text-moon text-2xl tracking-wider">{gate.title}</h2>
          <p className="font-serif italic text-lavender text-base leading-loose max-w-xs whitespace-pre-line">
            {gate.description}
          </p>
          <span className="text-[0.55rem] text-lavender/40 tracking-widest uppercase">{gate.hint}</span>
          <button className="btn-primary mt-2" onClick={handleActivate}>
            {gate.cta}
          </button>
          <button className="btn-ghost text-[0.6rem] py-2 px-6" onClick={handleBack}>
            {gate.back}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════
          SESIÓN ACTIVA
          ══════════════════════════════════ */}
      {screen === 'session' && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <div className="orb-stage">
            <div className="orb-halo" style={{ opacity: engineState.currentPhase === 'inhale' ? 1 : 0.15 }} />
            <div className="orb-ring" />
            <div className="orb-ring2" />
            <div
              className={`orb-body phase-${engineState.currentPhase}`}
              style={{
                transform:  `scale(${orbScale})`,
                transition: `transform ${orbDuration}s ${orbEasing}`,
              }}
            >
              <div className="orb-core" />
            </div>
          </div>

          <div className="flex flex-col items-center mt-8 gap-1">
            <div className="phase-label" style={{ opacity: engineState.currentPhase !== 'idle' ? 1 : 0 }}>
              {phaseLabel}
            </div>
            <div className="phase-count" style={{ opacity: engineState.currentPhase !== 'idle' ? 1 : 0 }}>
              {engineState.phaseSecondsRemaining > 0 ? engineState.phaseSecondsRemaining : ''}
            </div>
          </div>

          <div className={`session-hint ${hintVisible ? 'visible' : ''}`}>
            <button
              className="hint-btn"
              onClick={e => { e.stopPropagation(); togglePause() }}
              title={engineState.isPaused ? 'Reanudar' : 'Pausar'}
            >
              {engineState.isPaused ? '\u25b6' : '\u23f8'}
            </button>
            <button
              className="hint-btn"
              onClick={e => { e.stopPropagation(); handleExit() }}
              title="Salir"
            >
              \u2715
            </button>
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
