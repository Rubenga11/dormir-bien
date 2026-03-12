// types/index.ts — Tipos globales TypeScript

export type Genero    = 'Hombre' | 'Mujer' | 'Otro'
export type Edad      = '18–24' | '25–34' | '35–44' | '45–54' | '55–64' | '65+'
export type Medicacion = 'Sí, habitualmente' | 'A veces' | 'No'
export type HorasSueno = 'Menos de 5h' | '5–6h' | '6–7h' | '7–8h' | 'Más de 8h'
export type NombrePatron = 'Sueño Delta' | 'Sueño Profundo' | 'Adormecimiento' | 'Relajación'

export interface AudioPhaseParams {
  bandpassFreq:  number
  bandpassQ:     number
  lowpassFreq:   [number, number]   // [inicio, fin] — sweep durante la fase
  highpassFreq:  number
  volume:        number             // 0–1 volumen pico
  attackRatio:   number             // proporción del tiempo en subir volumen
  releaseRatio:  number             // proporción del tiempo en bajar volumen
  oscFreq:       [number, number]   // [inicio, fin] oscilador de calidez corporal
  oscVolume:     number
}

export interface BreathPattern {
  id:               number
  nombre:           NombrePatron
  nivel:            number          // 1 = más lento (delta) → 4 = más rápido
  emoji:            string
  descripcion:      string          // Una línea — para el selector
  descripcionLarga: string          // Para la landing
  inhala:           number          // segundos
  pausa:            number          // segundos (0 si no hay pausa)
  exhala:           number          // segundos
  rpm:              number          // respiraciones/minuto
  color:            string          // rgba — color del icono de la card
  audio: {
    inhale: AudioPhaseParams
    exhale: AudioPhaseParams
  }
}

export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'idle'

export interface BreathEngineState {
  isRunning:              boolean
  isPaused:               boolean
  currentPhase:           BreathPhase
  currentPattern:         BreathPattern | null
  cycleCount:             number
  phaseSecondsRemaining:  number
}

export type AppScreen =
  | 'landing'
  | 'registro'
  | 'selector'
  | 'audio-gate'
  | 'session'
  | 'admin-login'
  | 'admin-dashboard'

export interface UserRegistration {
  genero:          Genero
  edad:            Edad
  medicacion:      Medicacion
  ciudad:          string
  cp:              string
  horas_sueno:     HorasSueno
  email:           string
  consiente_email: boolean
  tecnica_favorita?: NombrePatron
}

export interface UserRecord extends UserRegistration {
  id:         string
  country?:   string
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  total_usuarios:    number
  total_sesiones:    number
  total_ciudades:    number
  pct_medicacion:    number
  nuevos_7dias:      number
  sesiones_7dias:    number
}

export interface ChartItem {
  label:       string
  value:       number
  percentage?: number
  color?:      string
}
