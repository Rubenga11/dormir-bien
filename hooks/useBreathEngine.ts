'use client'
// hooks/useBreathEngine.ts
// Motor de respiración — orquesta timers, fases y callbacks de animación

import { useState, useRef, useCallback, useEffect } from 'react'
import type { BreathPattern, BreathPhase, BreathEngineState } from '@/types'
import { useAudioSynth } from './useAudioSynth'

const INITIAL_STATE: BreathEngineState = {
  isRunning:             false,
  isPaused:              false,
  currentPhase:          'idle',
  currentPattern:        null,
  cycleCount:            0,
  phaseSecondsRemaining: 0,
}

export function useBreathEngine() {
  const [state, setState] = useState<BreathEngineState>(INITIAL_STATE)
  const { initAudio, playInhale, playExhale, playHold, cleanup } = useAudioSynth()

  // Refs — no causan re-renders y sobreviven entre renders
  const mainTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRunningRef   = useRef(false)
  const isPausedRef    = useRef(false)
  const currentPatRef  = useRef<BreathPattern | null>(null)

  // Auto-stop después de 10 minutos
  const MAX_SESSION_MS = 600_000
  const maxTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoStopStartRef   = useRef<number>(0)       // timestamp cuando se inició/reanudó
  const autoStopRemainingRef = useRef<number>(MAX_SESSION_MS) // ms restantes

  const clearTimers = useCallback(() => {
    if (mainTimerRef.current)  clearTimeout(mainTimerRef.current)
    if (countdownRef.current)  clearInterval(countdownRef.current)
    if (maxTimerRef.current)   clearTimeout(maxTimerRef.current)
    mainTimerRef.current  = null
    countdownRef.current  = null
    maxTimerRef.current   = null
  }, [])

  // Cuenta regresiva visual — actualiza cada 250ms para suavidad
  const startCountdown = useCallback((durationSec: number, phase: BreathPhase) => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    let remaining = durationSec

    setState(prev => ({ ...prev, currentPhase: phase, phaseSecondsRemaining: Math.ceil(remaining) }))

    countdownRef.current = setInterval(() => {
      remaining -= 0.25
      if (remaining <= 0) {
        clearInterval(countdownRef.current!)
        countdownRef.current = null
        return
      }
      setState(prev => ({ ...prev, phaseSecondsRemaining: Math.ceil(remaining) }))
    }, 250)
  }, [])

  // Ciclo principal — se llama recursivamente hasta que isRunning=false
  const runCycle = useCallback((pattern: BreathPattern) => {
    if (!isRunningRef.current || isPausedRef.current) return

    setState(prev => ({ ...prev, cycleCount: prev.cycleCount + 1 }))

    // ─── INHALA ───
    startCountdown(pattern.inhala, 'inhale')
    playInhale(pattern)

    mainTimerRef.current = setTimeout(() => {
      if (!isRunningRef.current || isPausedRef.current) return

      if (pattern.pausa > 0) {
        // ─── PAUSA ───
        startCountdown(pattern.pausa, 'hold')
        playHold()

        mainTimerRef.current = setTimeout(() => {
          if (!isRunningRef.current || isPausedRef.current) return
          doExhale(pattern)
        }, pattern.pausa * 1000)

      } else {
        doExhale(pattern)
      }
    }, pattern.inhala * 1000)

    function doExhale(p: BreathPattern) {
      if (!isRunningRef.current || isPausedRef.current) return
      // ─── EXHALA ───
      startCountdown(p.exhala, 'exhale')
      playExhale(p)

      mainTimerRef.current = setTimeout(() => {
        if (!isRunningRef.current || isPausedRef.current) return
        runCycle(p) // siguiente ciclo
      }, p.exhala * 1000)
    }
  }, [startCountdown, playInhale, playExhale, playHold])

  // Auto-stop: programa el temporizador con el tiempo restante
  const scheduleAutoStop = useCallback((remainingMs: number) => {
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    autoStopRemainingRef.current = remainingMs
    autoStopStartRef.current = Date.now()
    maxTimerRef.current = setTimeout(() => {
      // Se acabó el tiempo — parar limpiamente
      isRunningRef.current  = false
      isPausedRef.current   = false
      currentPatRef.current = null
      // Limpiar timers de fase (no llamamos clearTimers para evitar limpiar maxTimerRef ya disparado)
      if (mainTimerRef.current)  clearTimeout(mainTimerRef.current)
      if (countdownRef.current)  clearInterval(countdownRef.current)
      mainTimerRef.current  = null
      countdownRef.current  = null
      maxTimerRef.current   = null
      cleanup()
      setState(INITIAL_STATE)
    }, remainingMs)
  }, [cleanup])

  // Iniciar sesión
  // IMPORTANTE: initAudio() DEBE llamarse desde el event handler del botón AudioGate
  const start = useCallback(async (pattern: BreathPattern) => {
    await initAudio()
    clearTimers()
    isRunningRef.current  = true
    isPausedRef.current   = false
    currentPatRef.current = pattern

    setState({
      isRunning:             true,
      isPaused:              false,
      currentPhase:          'idle',
      currentPattern:        pattern,
      cycleCount:            0,
      phaseSecondsRemaining: 0,
    })

    scheduleAutoStop(MAX_SESSION_MS)
    runCycle(pattern)
  }, [initAudio, clearTimers, runCycle, scheduleAutoStop])

  // Pausar / Reanudar
  const togglePause = useCallback(() => {
    if (!isRunningRef.current) return

    if (!isPausedRef.current) {
      // Pausar — calcular tiempo restante del auto-stop
      const elapsed = Date.now() - autoStopStartRef.current
      autoStopRemainingRef.current = Math.max(0, autoStopRemainingRef.current - elapsed)
      isPausedRef.current = true
      clearTimers()
      setState(prev => ({ ...prev, isPaused: true, currentPhase: 'idle', phaseSecondsRemaining: 0 }))
    } else {
      // Reanudar — reprogramar auto-stop con tiempo restante
      isPausedRef.current = false
      setState(prev => ({ ...prev, isPaused: false }))
      scheduleAutoStop(autoStopRemainingRef.current)
      if (currentPatRef.current) runCycle(currentPatRef.current)
    }
  }, [clearTimers, runCycle, scheduleAutoStop])

  // Parar sesión
  const stop = useCallback(() => {
    isRunningRef.current  = false
    isPausedRef.current   = false
    currentPatRef.current = null
    clearTimers()
    cleanup()
    setState(INITIAL_STATE)
  }, [clearTimers, cleanup])

  // Cleanup al desmontar
  useEffect(() => () => { isRunningRef.current = false; clearTimers(); cleanup() }, [clearTimers, cleanup])

  // Derivados útiles para el componente
  const phaseLabel: Record<BreathPhase, string> = {
    inhale: 'INHALA',
    hold:   'PAUSA',
    exhale: 'EXHALA',
    idle:   '',
  }

  return {
    state,
    start,
    stop,
    togglePause,
    phaseLabel: phaseLabel[state.currentPhase],
  }
}
