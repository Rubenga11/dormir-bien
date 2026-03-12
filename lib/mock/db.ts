// lib/mock/db.ts — Base de datos en memoria (reemplaza Supabase)
// Preparada para ser sustituida por Supabase cuando haya credenciales

import type { NombrePatron } from '@/types'

// ── Tipos internos
interface MockUser {
  id: string
  genero: string
  edad: string
  medicacion: string
  localidad: string
  horas_sueno: string
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

// ── Almacén en memoria
const users: MockUser[] = []
const sessions: MockSession[] = []
let totalSessions = 52

// ── Datos demo (14 usuarios del SQL)
const demoUsers: Omit<MockUser, 'id' | 'ip_hash' | 'user_agent' | 'country' | 'updated_at'>[] = [
  { genero: 'Mujer',  edad: '25–34', medicacion: 'No',                localidad: 'Madrid',     horas_sueno: '6–7h',        tecnica_favorita: 'Sueño Delta',    created_at: '2025-10-05T00:00:00Z' },
  { genero: 'Hombre', edad: '35–44', medicacion: 'Sí, habitualmente', localidad: 'Barcelona',  horas_sueno: '5–6h',        tecnica_favorita: 'Sueño Profundo', created_at: '2025-10-08T00:00:00Z' },
  { genero: 'Mujer',  edad: '18–24', medicacion: 'A veces',           localidad: 'Valencia',   horas_sueno: '7–8h',        tecnica_favorita: 'Adormecimiento', created_at: '2025-10-11T00:00:00Z' },
  { genero: 'Otro',   edad: '45–54', medicacion: 'No',                localidad: 'Sevilla',    horas_sueno: 'Menos de 5h', tecnica_favorita: 'Relajación',     created_at: '2025-10-15T00:00:00Z' },
  { genero: 'Mujer',  edad: '25–34', medicacion: 'No',                localidad: 'Madrid',     horas_sueno: '6–7h',        tecnica_favorita: 'Sueño Delta',    created_at: '2025-10-18T00:00:00Z' },
  { genero: 'Hombre', edad: '55–64', medicacion: 'Sí, habitualmente', localidad: 'Bilbao',     horas_sueno: '7–8h',        tecnica_favorita: 'Sueño Delta',    created_at: '2025-10-22T00:00:00Z' },
  { genero: 'Mujer',  edad: '35–44', medicacion: 'A veces',           localidad: 'Zaragoza',   horas_sueno: '6–7h',        tecnica_favorita: 'Sueño Profundo', created_at: '2025-10-28T00:00:00Z' },
  { genero: 'Hombre', edad: '18–24', medicacion: 'No',                localidad: 'Málaga',     horas_sueno: '7–8h',        tecnica_favorita: 'Adormecimiento', created_at: '2025-11-01T00:00:00Z' },
  { genero: 'Mujer',  edad: '25–34', medicacion: 'No',                localidad: 'Madrid',     horas_sueno: 'Más de 8h',   tecnica_favorita: 'Sueño Delta',    created_at: '2025-11-06T00:00:00Z' },
  { genero: 'Hombre', edad: '45–54', medicacion: 'Sí, habitualmente', localidad: 'Barcelona',  horas_sueno: '5–6h',        tecnica_favorita: 'Relajación',     created_at: '2025-11-10T00:00:00Z' },
  { genero: 'Mujer',  edad: '65+',   medicacion: 'A veces',           localidad: 'Valencia',   horas_sueno: '6–7h',        tecnica_favorita: 'Sueño Profundo', created_at: '2025-11-14T00:00:00Z' },
  { genero: 'Otro',   edad: '35–44', medicacion: 'No',                localidad: 'Murcia',     horas_sueno: '7–8h',        tecnica_favorita: 'Sueño Delta',    created_at: '2025-11-20T00:00:00Z' },
  { genero: 'Hombre', edad: '25–34', medicacion: 'No',                localidad: 'Alicante',   horas_sueno: '6–7h',        tecnica_favorita: 'Adormecimiento', created_at: '2025-11-25T00:00:00Z' },
  { genero: 'Mujer',  edad: '18–24', medicacion: 'A veces',           localidad: 'Valladolid', horas_sueno: '5–6h',        tecnica_favorita: 'Sueño Profundo', created_at: '2025-12-01T00:00:00Z' },
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

// ── CRUD Functions

export function insertUser(data: {
  genero: string
  edad: string
  medicacion: string
  localidad: string
  horas_sueno: string
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
    localidad: data.localidad,
    horas_sueno: data.horas_sueno,
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

export function updateUser(id: string, data: Partial<Pick<MockUser, 'genero' | 'edad' | 'medicacion' | 'localidad' | 'horas_sueno' | 'tecnica_favorita'>>): boolean {
  const user = users.find(u => u.id === id)
  if (!user) return false
  if (data.genero !== undefined) user.genero = data.genero
  if (data.edad !== undefined) user.edad = data.edad
  if (data.medicacion !== undefined) user.medicacion = data.medicacion
  if (data.localidad !== undefined) user.localidad = data.localidad
  if (data.horas_sueno !== undefined) user.horas_sueno = data.horas_sueno
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
  const localidades = new Set(users.map(u => u.localidad.toLowerCase().trim()))
  const total_localidades = localidades.size
  const medCount = users.filter(u => u.medicacion === 'Sí, habitualmente').length
  const pct_medicacion = total_usuarios > 0
    ? Math.round(medCount * 1000 / total_usuarios) / 10
    : 0
  const nuevos_7dias = users.filter(u => new Date(u.created_at).getTime() > sevenDaysAgo).length
  const sesiones_7dias = sessions.filter(s => new Date(s.created_at).getTime() > sevenDaysAgo).length

  return { total_usuarios, total_sesiones, total_localidades, pct_medicacion, nuevos_7dias, sesiones_7dias }
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
