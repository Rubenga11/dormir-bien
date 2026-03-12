// lib/mock/db.ts — Base de datos en memoria (reemplaza Supabase)
// Preparada para ser sustituida por Supabase cuando haya credenciales

import type { NombrePatron } from '@/types'

// ── Tipos internos
interface MockUser {
  id: string
  genero: string
  edad: string
  medicacion: string
  ciudad: string
  cp: string
  horas_sueno: string
  email: string | null
  consiente_email: boolean
  tecnica_favorita: string | null
  ip_hash: string | null
  user_agent: string | null
  country: string | null
  created_at: string
  updated_at: string
}

interface MockSession {
  id: string
  user_id: string | null
  patron: string
  duracion_segundos: number | null
  completada: boolean
  created_at: string
}

// ── UUID simple
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ── Seeded random for deterministic demo data
let _seed = 42
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647
  return (_seed - 1) / 2147483646
}

// ── Almacén en memoria
const users: MockUser[] = []
const sessions: MockSession[] = []
let totalSessions = 52

// ── Datos demo (14 usuarios del SQL)
const demoUsers: Omit<MockUser, 'id' | 'ip_hash' | 'user_agent' | 'country' | 'updated_at'>[] = [
  { genero: 'Mujer',  edad: '25–34', medicacion: 'No',                ciudad: 'Madrid',     cp: '28001', horas_sueno: '6–7h',        email: 'usuario1@ejemplo.com',  consiente_email: true,  tecnica_favorita: 'Sueño Delta',    created_at: '2025-10-05T00:00:00Z' },
  { genero: 'Hombre', edad: '35–44', medicacion: 'Sí, habitualmente', ciudad: 'Barcelona',  cp: '08001', horas_sueno: '5–6h',        email: 'usuario2@ejemplo.com',  consiente_email: true,  tecnica_favorita: 'Sueño Profundo', created_at: '2025-10-08T00:00:00Z' },
  { genero: 'Mujer',  edad: '18–24', medicacion: 'A veces',           ciudad: 'Valencia',   cp: '46001', horas_sueno: '7–8h',        email: 'usuario3@ejemplo.com',  consiente_email: true,  tecnica_favorita: 'Adormecimiento', created_at: '2025-10-11T00:00:00Z' },
  { genero: 'Otro',   edad: '45–54', medicacion: 'No',                ciudad: 'Sevilla',    cp: '41001', horas_sueno: 'Menos de 5h', email: 'usuario4@ejemplo.com',  consiente_email: false, tecnica_favorita: 'Relajación',     created_at: '2025-10-15T00:00:00Z' },
  { genero: 'Mujer',  edad: '25–34', medicacion: 'No',                ciudad: 'Madrid',     cp: '28002', horas_sueno: '6–7h',        email: 'usuario5@ejemplo.com',  consiente_email: true,  tecnica_favorita: 'Sueño Delta',    created_at: '2025-10-18T00:00:00Z' },
  { genero: 'Hombre', edad: '55–64', medicacion: 'Sí, habitualmente', ciudad: 'Bilbao',     cp: '48001', horas_sueno: '7–8h',        email: 'usuario6@ejemplo.com',  consiente_email: true,  tecnica_favorita: 'Sueño Delta',    created_at: '2025-10-22T00:00:00Z' },
  { genero: 'Mujer',  edad: '35–44', medicacion: 'A veces',           ciudad: 'Zaragoza',   cp: '50001', horas_sueno: '6–7h',        email: 'usuario7@ejemplo.com',  consiente_email: true,  tecnica_favorita: 'Sueño Profundo', created_at: '2025-10-28T00:00:00Z' },
  { genero: 'Hombre', edad: '18–24', medicacion: 'No',                ciudad: 'Málaga',     cp: '29001', horas_sueno: '7–8h',        email: 'usuario8@ejemplo.com',  consiente_email: false, tecnica_favorita: 'Adormecimiento', created_at: '2025-11-01T00:00:00Z' },
  { genero: 'Mujer',  edad: '25–34', medicacion: 'No',                ciudad: 'Madrid',     cp: '28003', horas_sueno: 'Más de 8h',   email: 'usuario9@ejemplo.com',  consiente_email: true,  tecnica_favorita: 'Sueño Delta',    created_at: '2025-11-06T00:00:00Z' },
  { genero: 'Hombre', edad: '45–54', medicacion: 'Sí, habitualmente', ciudad: 'Barcelona',  cp: '08002', horas_sueno: '5–6h',        email: 'usuario10@ejemplo.com', consiente_email: true,  tecnica_favorita: 'Relajación',     created_at: '2025-11-10T00:00:00Z' },
  { genero: 'Mujer',  edad: '65+',   medicacion: 'A veces',           ciudad: 'Valencia',   cp: '46002', horas_sueno: '6–7h',        email: 'usuario11@ejemplo.com', consiente_email: true,  tecnica_favorita: 'Sueño Profundo', created_at: '2025-11-14T00:00:00Z' },
  { genero: 'Otro',   edad: '35–44', medicacion: 'No',                ciudad: 'Murcia',     cp: '30001', horas_sueno: '7–8h',        email: 'usuario12@ejemplo.com', consiente_email: true,  tecnica_favorita: 'Sueño Delta',    created_at: '2025-11-20T00:00:00Z' },
  { genero: 'Hombre', edad: '25–34', medicacion: 'No',                ciudad: 'Alicante',   cp: '03001', horas_sueno: '6–7h',        email: 'usuario13@ejemplo.com', consiente_email: false, tecnica_favorita: 'Adormecimiento', created_at: '2025-11-25T00:00:00Z' },
  { genero: 'Mujer',  edad: '18–24', medicacion: 'A veces',           ciudad: 'Valladolid', cp: '47001', horas_sueno: '5–6h',        email: 'usuario14@ejemplo.com', consiente_email: true,  tecnica_favorita: 'Sueño Profundo', created_at: '2025-12-01T00:00:00Z' },
]

// Inicializar datos demo
for (const u of demoUsers) {
  users.push({
    ...u,
    id: uuid(),
    ip_hash: null,
    user_agent: null,
    country: 'ES',
    updated_at: u.created_at,
  })
}

// ── Generar ~60 sesiones demo vinculadas a usuarios
const tecnicas = ['Sueño Delta', 'Sueño Profundo', 'Adormecimiento', 'Relajación']

function generateDemoSessions() {
  const startDate = new Date('2025-10-01T00:00:00Z').getTime()
  const endDate = new Date('2025-12-31T23:59:59Z').getTime()
  const range = endDate - startDate

  for (let i = 0; i < 60; i++) {
    const userIdx = Math.floor(seededRandom() * users.length)
    const user = users[userIdx]
    // Bias toward user's favorite technique (~60% chance)
    const useFavorite = seededRandom() < 0.6
    const patron = useFavorite && user.tecnica_favorita
      ? user.tecnica_favorita
      : tecnicas[Math.floor(seededRandom() * tecnicas.length)]

    const duracion = Math.floor(120 + seededRandom() * 480) // 120-600 seconds
    const completada = seededRandom() < 0.8

    // Distribute across Oct-Dec with time-of-day variation
    const timestamp = startDate + Math.floor(seededRandom() * range)
    const date = new Date(timestamp)
    // Bias hours toward evening (18-23) and early morning (6-9)
    const hourBias = seededRandom()
    let hour: number
    if (hourBias < 0.5) {
      hour = 18 + Math.floor(seededRandom() * 6) // 18-23
    } else if (hourBias < 0.8) {
      hour = 6 + Math.floor(seededRandom() * 4) // 6-9
    } else {
      hour = Math.floor(seededRandom() * 24)
    }
    date.setUTCHours(hour, Math.floor(seededRandom() * 60))

    sessions.push({
      id: uuid(),
      user_id: user.id,
      patron,
      duracion_segundos: completada ? duracion : Math.floor(duracion * seededRandom() * 0.7),
      completada,
      created_at: date.toISOString(),
    })
  }

  // Sort by date
  sessions.sort((a, b) => a.created_at.localeCompare(b.created_at))
  totalSessions = 52 + sessions.length // keep the original counter base
}

generateDemoSessions()

// ── CRUD Functions

export function insertUser(data: {
  genero: string
  edad: string
  medicacion: string
  ciudad: string
  cp: string
  horas_sueno: string
  email?: string | null
  consiente_email?: boolean
  tecnica_favorita?: string | null
  ip_hash?: string | null
  user_agent?: string | null
  country?: string | null
}): { id: string } {
  const now = new Date().toISOString()
  const user: MockUser = {
    id: uuid(),
    genero: data.genero,
    edad: data.edad,
    medicacion: data.medicacion,
    ciudad: data.ciudad,
    cp: data.cp,
    horas_sueno: data.horas_sueno,
    email: data.email || null,
    consiente_email: data.consiente_email ?? false,
    tecnica_favorita: data.tecnica_favorita || null,
    ip_hash: data.ip_hash || null,
    user_agent: data.user_agent || null,
    country: data.country || null,
    created_at: now,
    updated_at: now,
  }
  users.push(user)
  return { id: user.id }
}

export function getUsers(): MockUser[] {
  return [...users].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getUserById(id: string): MockUser | undefined {
  return users.find(u => u.id === id)
}

export function updateUser(id: string, data: Partial<Pick<MockUser, 'genero' | 'edad' | 'medicacion' | 'ciudad' | 'cp' | 'horas_sueno' | 'email' | 'consiente_email' | 'tecnica_favorita'>>): boolean {
  const user = users.find(u => u.id === id)
  if (!user) return false
  if (data.genero !== undefined) user.genero = data.genero
  if (data.edad !== undefined) user.edad = data.edad
  if (data.medicacion !== undefined) user.medicacion = data.medicacion
  if (data.ciudad !== undefined) user.ciudad = data.ciudad
  if (data.cp !== undefined) user.cp = data.cp
  if (data.horas_sueno !== undefined) user.horas_sueno = data.horas_sueno
  if (data.email !== undefined) user.email = data.email
  if (data.consiente_email !== undefined) user.consiente_email = data.consiente_email
  if (data.tecnica_favorita !== undefined) user.tecnica_favorita = data.tecnica_favorita
  user.updated_at = new Date().toISOString()
  return true
}

export function insertSession(data: {
  user_id?: string | null
  patron: string
  duracion_segundos?: number | null
  completada?: boolean
}): void {
  sessions.push({
    id: uuid(),
    user_id: data.user_id || null,
    patron: data.patron,
    duracion_segundos: data.duracion_segundos || null,
    completada: data.completada || false,
    created_at: new Date().toISOString(),
  })
  totalSessions++
}

export function getSessionsByUser(userId: string): MockSession[] {
  return sessions.filter(s => s.user_id === userId)
}

export function getMostUsedPattern(userId: string): NombrePatron | null {
  const userSessions = getSessionsByUser(userId)
  if (userSessions.length === 0) return null

  const counts: Record<string, number> = {}
  for (const s of userSessions) {
    counts[s.patron] = (counts[s.patron] || 0) + 1
  }

  let max = 0
  let top = ''
  for (const [patron, count] of Object.entries(counts)) {
    if (count > max) { max = count; top = patron }
  }
  return top as NombrePatron
}

// ── Funciones de agregación (réplicas de vistas SQL)

export function getDashboardSummary() {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

  const total_usuarios = users.length
  const total_sesiones = totalSessions
  const ciudades = new Set(users.map(u => u.ciudad.toLowerCase().trim()))
  const total_ciudades = ciudades.size
  const medCount = users.filter(u => u.medicacion === 'Sí, habitualmente').length
  const pct_medicacion = total_usuarios > 0
    ? Math.round(medCount * 1000 / total_usuarios) / 10
    : 0
  const nuevos_7dias = users.filter(u => new Date(u.created_at).getTime() > sevenDaysAgo).length
  const sesiones_7dias = sessions.filter(s => new Date(s.created_at).getTime() > sevenDaysAgo).length

  // New: completion rate and average duration
  const completadas = sessions.filter(s => s.completada).length
  const tasa_completacion = sessions.length > 0
    ? Math.round(completadas * 1000 / sessions.length) / 10
    : 0
  const durations = sessions.filter(s => s.duracion_segundos).map(s => s.duracion_segundos!)
  const duracion_media = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0

  return { total_usuarios, total_sesiones, total_ciudades, pct_medicacion, nuevos_7dias, sesiones_7dias, tasa_completacion, duracion_media }
}

export function getByGenero() {
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.genero] = (counts[u.genero] || 0) + 1

  const total = users.length || 1
  return Object.entries(counts)
    .map(([genero, count]) => ({
      genero,
      total: count,
      porcentaje: Math.round(count * 1000 / total) / 10,
    }))
    .sort((a, b) => b.total - a.total)
}

export function getByEdad() {
  const order = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+']
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.edad] = (counts[u.edad] || 0) + 1

  return order
    .filter(edad => counts[edad])
    .map(edad => ({ edad, total: counts[edad] }))
}

export function getByMedicacion() {
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.medicacion] = (counts[u.medicacion] || 0) + 1

  const total = users.length || 1
  return Object.entries(counts)
    .map(([medicacion, count]) => ({
      medicacion,
      total: count,
      porcentaje: Math.round(count * 1000 / total) / 10,
    }))
    .sort((a, b) => b.total - a.total)
}

export function getByTecnica() {
  const counts: Record<string, number> = {}
  for (const u of users) {
    if (u.tecnica_favorita) counts[u.tecnica_favorita] = (counts[u.tecnica_favorita] || 0) + 1
  }

  return Object.entries(counts)
    .map(([tecnica_favorita, total]) => ({ tecnica_favorita, total }))
    .sort((a, b) => b.total - a.total)
}

export function getByHoras() {
  const order = ['Menos de 5h', '5–6h', '6–7h', '7–8h', 'Más de 8h']
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.horas_sueno] = (counts[u.horas_sueno] || 0) + 1

  return order
    .filter(h => counts[h])
    .map(horas_sueno => ({ horas_sueno, total: counts[horas_sueno] }))
}

// ══════════════════════════════════════════
// NUEVAS FUNCIONES DE AGREGACIÓN — Sesiones
// ══════════════════════════════════════════

export function getAllSessions(): MockSession[] {
  return [...sessions].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getSessionsSummary() {
  const total = sessions.length
  const completadas = sessions.filter(s => s.completada).length
  const tasa_completacion = total > 0 ? Math.round(completadas * 1000 / total) / 10 : 0
  const durations = sessions.filter(s => s.duracion_segundos).map(s => s.duracion_segundos!)
  const duracion_media = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0
  const tiempo_total = durations.reduce((a, b) => a + b, 0)

  const now = Date.now()
  const hoy = sessions.filter(s => {
    const d = new Date(s.created_at)
    const today = new Date()
    return d.getUTCFullYear() === today.getUTCFullYear() &&
           d.getUTCMonth() === today.getUTCMonth() &&
           d.getUTCDate() === today.getUTCDate()
  }).length
  const ultimos_7d = sessions.filter(s => new Date(s.created_at).getTime() > now - 7 * 86400000).length
  const ultimos_30d = sessions.filter(s => new Date(s.created_at).getTime() > now - 30 * 86400000).length

  return { total, completadas, tasa_completacion, duracion_media, tiempo_total, hoy, ultimos_7d, ultimos_30d }
}

export function getSessionsByTecnica() {
  const byTecnica: Record<string, { count: number; completadas: number; duraciones: number[] }> = {}
  for (const s of sessions) {
    if (!byTecnica[s.patron]) byTecnica[s.patron] = { count: 0, completadas: 0, duraciones: [] }
    byTecnica[s.patron].count++
    if (s.completada) byTecnica[s.patron].completadas++
    if (s.duracion_segundos) byTecnica[s.patron].duraciones.push(s.duracion_segundos)
  }

  return Object.entries(byTecnica).map(([tecnica, d]) => ({
    tecnica,
    count: d.count,
    completadas: d.completadas,
    tasa: d.count > 0 ? Math.round(d.completadas * 1000 / d.count) / 10 : 0,
    duracion_media: d.duraciones.length > 0
      ? Math.round(d.duraciones.reduce((a, b) => a + b, 0) / d.duraciones.length)
      : 0,
  })).sort((a, b) => b.count - a.count)
}

export function getSessionsByDay(days: number = 90) {
  const now = new Date()
  const result: { date: string; count: number; completed: number }[] = []
  const map: Record<string, { count: number; completed: number }> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map[key] = { count: 0, completed: 0 }
  }

  for (const s of sessions) {
    const key = s.created_at.slice(0, 10)
    if (map[key]) {
      map[key].count++
      if (s.completada) map[key].completed++
    }
  }

  for (const [date, v] of Object.entries(map)) {
    result.push({ date, ...v })
  }
  return result.sort((a, b) => a.date.localeCompare(b.date))
}

export function getSessionsByHour() {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
  for (const s of sessions) {
    const h = new Date(s.created_at).getUTCHours()
    hours[h].count++
  }
  return hours
}

export function getEngagementDistribution() {
  // Count sessions per user
  const userSessionCounts: Record<string, number> = {}
  for (const s of sessions) {
    if (s.user_id) {
      userSessionCounts[s.user_id] = (userSessionCounts[s.user_id] || 0) + 1
    }
  }

  const buckets = [
    { bucket: '1', min: 1, max: 1, count: 0 },
    { bucket: '2-5', min: 2, max: 5, count: 0 },
    { bucket: '6-10', min: 6, max: 10, count: 0 },
    { bucket: '11+', min: 11, max: Infinity, count: 0 },
  ]

  for (const count of Object.values(userSessionCounts)) {
    for (const b of buckets) {
      if (count >= b.min && count <= b.max) { b.count++; break }
    }
  }

  return buckets.map(({ bucket, count }) => ({ bucket, count }))
}

// ══════════════════════════════════════════
// NUEVAS FUNCIONES DE AGREGACIÓN — Correlaciones
// ══════════════════════════════════════════

export function getTecnicaByGenero() {
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!result[user.genero]) result[user.genero] = {}
    result[user.genero][s.patron] = (result[user.genero][s.patron] || 0) + 1
  }
  return result
}

export function getTecnicaByEdad() {
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!result[user.edad]) result[user.edad] = {}
    result[user.edad][s.patron] = (result[user.edad][s.patron] || 0) + 1
  }
  return result
}

export function getTecnicaByMedicacion() {
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!result[user.medicacion]) result[user.medicacion] = {}
    result[user.medicacion][s.patron] = (result[user.medicacion][s.patron] || 0) + 1
  }
  return result
}

export function getCompletionByMedicacion() {
  const data: Record<string, { total: number; completed: number }> = {}
  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!data[user.medicacion]) data[user.medicacion] = { total: 0, completed: 0 }
    data[user.medicacion].total++
    if (s.completada) data[user.medicacion].completed++
  }

  return Object.entries(data).map(([medicacion, d]) => ({
    medicacion,
    rate: d.total > 0 ? Math.round(d.completed * 1000 / d.total) / 10 : 0,
  }))
}

export function getDuracionByEdad() {
  const data: Record<string, number[]> = {}
  for (const s of sessions) {
    if (!s.user_id || !s.duracion_segundos) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!data[user.edad]) data[user.edad] = []
    data[user.edad].push(s.duracion_segundos)
  }

  const order = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+']
  return order
    .filter(edad => data[edad])
    .map(edad => ({
      edad,
      avgDuration: Math.round(data[edad].reduce((a, b) => a + b, 0) / data[edad].length),
    }))
}

export function getHorasSuenoByTecnica() {
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!result[s.patron]) result[s.patron] = {}
    result[s.patron][user.horas_sueno] = (result[s.patron][user.horas_sueno] || 0) + 1
  }
  return result
}

export function getMedicacionByHorasSueno() {
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!result[user.horas_sueno]) result[user.horas_sueno] = {}
    result[user.horas_sueno][user.medicacion] = (result[user.horas_sueno][user.medicacion] || 0) + 1
  }
  return result
}

// ══════════════════════════════════════════
// NUEVAS FUNCIONES DE AGREGACIÓN — Geográfico
// ══════════════════════════════════════════

export function getUsersByCountry() {
  const counts: Record<string, number> = {}
  for (const u of users) {
    const country = u.country || 'Desconocido'
    counts[country] = (counts[country] || 0) + 1
  }
  return Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
}

export function getUsersByCiudad() {
  const counts: Record<string, number> = {}
  for (const u of users) {
    counts[u.ciudad] = (counts[u.ciudad] || 0) + 1
  }
  return Object.entries(counts)
    .map(([ciudad, count]) => ({ ciudad, count }))
    .sort((a, b) => b.count - a.count)
}

export function getSessionsByCountry() {
  const counts: Record<string, number> = {}
  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    const country = user.country || 'Desconocido'
    counts[country] = (counts[country] || 0) + 1
  }
  return Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
}

export function getGeoTable() {
  // City-level table with users, sessions, top technique
  const cityData: Record<string, { country: string; users: Set<string>; sessions: number; tecnicas: Record<string, number> }> = {}

  for (const u of users) {
    if (!cityData[u.ciudad]) {
      cityData[u.ciudad] = { country: u.country || 'ES', users: new Set(), sessions: 0, tecnicas: {} }
    }
    cityData[u.ciudad].users.add(u.id)
  }

  for (const s of sessions) {
    if (!s.user_id) continue
    const user = users.find(u => u.id === s.user_id)
    if (!user) continue
    if (!cityData[user.ciudad]) continue
    cityData[user.ciudad].sessions++
    cityData[user.ciudad].tecnicas[s.patron] = (cityData[user.ciudad].tecnicas[s.patron] || 0) + 1
  }

  return Object.entries(cityData)
    .map(([ciudad, d]) => {
      const topTecnica = Object.entries(d.tecnicas).sort((a, b) => b[1] - a[1])[0]
      return {
        ciudad,
        country: d.country,
        usuarios: d.users.size,
        sesiones: d.sessions,
        tecnica_top: topTecnica ? topTecnica[0] : '–',
      }
    })
    .sort((a, b) => b.usuarios - a.usuarios)
}
