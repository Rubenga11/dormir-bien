'use client'
// hooks/useWakeLock.ts
// Impide que la pantalla se apague durante la sesión de respiración

import { useRef, useCallback } from 'react'

export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  const acquire = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      lockRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // Falla silenciosamente — algunos navegadores lo bloquean en segundo plano
    }
  }, [])

  const release = useCallback(async () => {
    if (lockRef.current) {
      await lockRef.current.release().catch(() => {})
      lockRef.current = null
    }
  }, [])

  return { acquire, release }
}
