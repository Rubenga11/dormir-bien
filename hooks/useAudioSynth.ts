'use client'
// hooks/useAudioSynth.ts
// Motor de síntesis de sonido de respiración humana
// Usa Web Audio API pura. Sin librerías externas.
// CRÍTICO: initAudio() debe llamarse DENTRO de un event handler de click/touch

import { useRef, useCallback } from 'react'
import type { BreathPattern, AudioPhaseParams } from '@/types'

export function useAudioSynth() {
  const ctxRef = useRef<AudioContext | null>(null)

  // Inicializar (o reanudar) el AudioContext
  // SIEMPRE llamar desde un event handler — el navegador bloquea fuera de gesto de usuario
  const initAudio = useCallback(async () => {
    if (!ctxRef.current) {
      // iOS Silent Mode: reproducir <audio> silencioso ANTES de crear AudioContext
      // Esto fuerza la audio session a "playback" (ignora switch silencio)
      // DEBE ejecutarse dentro de un gesto de usuario (click/touch)
      try {
        const silentDataUri = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
        const audioEl = document.createElement('audio')
        audioEl.setAttribute('playsinline', '')
        audioEl.src = silentDataUri
        await audioEl.play()
      } catch {
        // ignore — best-effort unlock
      }

      ctxRef.current = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

      // Auto-resumir si el AudioContext pasa a suspended (e.g. Android background)
      const ctx = ctxRef.current
      ctx.addEventListener('statechange', () => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {})
        }
      })
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  // Generador de ruido rosa — aproximación algoritmo Voss-McCartney
  // El ruido rosa (espectro 1/f) es el más parecido al sonido de respiración humana
  const createPinkNoise = useCallback((ctx: AudioContext, durationSec: number): AudioBuffer => {
    const bufLen = Math.ceil(ctx.sampleRate * durationSec)
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data   = buf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0
    for (let i = 0; i < bufLen; i++) {
      const w = Math.random() * 2 - 1
      b0 =  0.99886 * b0 + w * 0.0555179
      b1 =  0.99332 * b1 + w * 0.0750759
      b2 =  0.96900 * b2 + w * 0.1538520
      b3 =  0.86650 * b3 + w * 0.3104856
      b4 =  0.55000 * b4 + w * 0.5329522
      b5 = -0.76160 * b5 - w * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + w * 0.5362) * 0.11
    }
    return buf
  }, [])

  // Construir y disparar un sonido de respiración según parámetros
  const playPhase = useCallback((
    durationSec: number,
    params: AudioPhaseParams
  ) => {
    const ctx = ctxRef.current
    if (!ctx) return

    const now    = ctx.currentTime
    const atk    = durationSec * params.attackRatio
    const rel    = durationSec * params.releaseRatio

    // Ruido rosa filtrado — cuerpo principal del sonido
    const noiseBuf = createPinkNoise(ctx, durationSec)
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf

    // Bandpass — centro de frecuencia de la textura del aire
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = params.bandpassFreq
    bp.Q.value = params.bandpassQ

    // Lowpass con sweep — abre o cierra el sonido durante la fase
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(params.lowpassFreq[0], now)
    lp.frequency.linearRampToValueAtTime(params.lowpassFreq[1], now + durationSec)

    // Highpass — elimina el rumble sub-grave
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = params.highpassFreq

    // Envolvente ADSR del volumen
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(params.volume, now + atk)
    gain.gain.setValueAtTime(params.volume, now + durationSec - rel)
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec)

    // Oscilador sinusoidal — añade calidez y humanidad al sonido (muy bajo volumen)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(params.oscFreq[0], now)
    osc.frequency.linearRampToValueAtTime(params.oscFreq[1], now + durationSec)
    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0, now)
    oscGain.gain.linearRampToValueAtTime(params.oscVolume, now + atk)
    oscGain.gain.linearRampToValueAtTime(0, now + durationSec)

    // Cadena de señal: src → hp → bp → lp → gain → speakers
    src.connect(hp)
    hp.connect(bp)
    bp.connect(lp)
    lp.connect(gain)
    osc.connect(oscGain)
    oscGain.connect(gain)
    gain.connect(ctx.destination)

    src.start(now)
    src.stop(now + durationSec)
    osc.start(now)
    osc.stop(now + durationSec)
  }, [createPinkNoise])

  const playInhale = useCallback((pattern: BreathPattern) => {
    playPhase(pattern.inhala, pattern.audio.inhale)
  }, [playPhase])

  const playExhale = useCallback((pattern: BreathPattern) => {
    playPhase(pattern.exhala, pattern.audio.exhale)
  }, [playPhase])

  // La pausa es silencio real — no hacer nada
  const playHold = useCallback(() => {}, [])

  const cleanup = useCallback(() => {
    ctxRef.current?.close()
    ctxRef.current = null
  }, [])

  return { initAudio, playInhale, playExhale, playHold, cleanup }
}
