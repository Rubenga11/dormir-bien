// lib/postgres/db.ts — PostgreSQL implementation (replaces Supabase)
import { query, queryOne } from './pool'
import { runMigrations } from './migrate'
import type { NombrePatron, BlogPost, Retreat, RetreatRegistration } from '@/types'

// Ensure schema exists on first query
let ready = false
async function ensureReady() {
  if (!ready) { await runMigrations(); ready = true }
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// ══════════════════════════════════════════
// USERS
// ══════════════════════════════════════════

export async function insertUser(data: {
  genero: string; edad: string; medicacion: string; ciudad: string; cp: string
  horas_sueno: string; email?: string | null; consiente_email?: boolean
  tecnica_favorita?: string | null; ip_hash?: string | null; user_agent?: string | null; country?: string | null
}): Promise<{ id: string }> {
  await ensureReady()
  const row = await queryOne<{ id: string }>(
    `INSERT INTO users (genero, edad, medicacion, localidad, cp, horas_sueno, tecnica_favorita, ip_hash, user_agent, country, email, consiente_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [data.genero, data.edad, data.medicacion, data.ciudad, data.cp, data.horas_sueno,
     data.tecnica_favorita || null, data.ip_hash || null, data.user_agent || null, data.country || null,
     data.email || null, data.consiente_email ?? false]
  )
  if (!row) throw new Error('Insert user returned no row')
  return { id: row.id }
}

export async function getUsers() {
  await ensureReady()
  return query('SELECT * FROM users ORDER BY created_at DESC')
}

export async function getUserById(id: string) {
  await ensureReady()
  return queryOne('SELECT * FROM users WHERE id = $1', [id])
}

export async function updateUser(id: string, updates: Record<string, unknown>): Promise<boolean> {
  await ensureReady()
  const keys = Object.keys(updates).filter(k => updates[k] !== undefined)
  if (keys.length === 0) return false
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const vals = keys.map(k => updates[k])
  const result = await query(`UPDATE users SET ${sets}, updated_at = NOW() WHERE id = $1`, [id, ...vals])
  return true
}

// ══════════════════════════════════════════
// SESSIONS
// ══════════════════════════════════════════

export async function insertSession(data: {
  user_id?: string | null; patron: string; duracion_segundos?: number | null; completada?: boolean
}): Promise<{ id: string }> {
  await ensureReady()
  const row = await queryOne<{ id: string }>(
    `INSERT INTO sessions (user_id, patron, duracion_segundos, completada) VALUES ($1,$2,$3,$4) RETURNING id`,
    [data.user_id || null, data.patron, data.duracion_segundos || null, data.completada || false]
  )
  if (!row) throw new Error('Insert session returned no row')
  return { id: row.id }
}

export async function updateSession(id: string, updates: { duracion_segundos?: number; completada?: boolean }): Promise<boolean> {
  await ensureReady()
  const keys = Object.keys(updates).filter(k => (updates as any)[k] !== undefined)
  if (keys.length === 0) return false
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const vals = keys.map(k => (updates as any)[k])
  await query(`UPDATE sessions SET ${sets} WHERE id = $1`, [id, ...vals])
  return true
}

export async function getSessionsByUser(userId: string) {
  await ensureReady()
  return query('SELECT * FROM sessions WHERE user_id = $1', [userId])
}

export async function getMostUsedPattern(userId: string): Promise<NombrePatron | null> {
  const sessions = await getSessionsByUser(userId)
  if (sessions.length === 0) return null
  const counts: Record<string, number> = {}
  for (const s of sessions) counts[s.patron] = (counts[s.patron] || 0) + 1
  let max = 0, top = ''
  for (const [patron, count] of Object.entries(counts)) {
    if (count > max) { max = count; top = patron }
  }
  return top as NombrePatron
}

export async function getAllSessions() {
  await ensureReady()
  return query('SELECT * FROM sessions ORDER BY created_at DESC')
}

// ══════════════════════════════════════════
// USER DETAIL (per-user stats)
// ══════════════════════════════════════════

export async function getUsersWithStats() {
  const [users, sessions] = await Promise.all([getUsers(), getAllSessions()])
  const sessionsByUser: Record<string, { total: number; completadas: number; duracionTotal: number; tecnicas: Record<string, number>; lastSession: string | null }> = {}

  for (const s of sessions) {
    if (!s.user_id) continue
    if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = { total: 0, completadas: 0, duracionTotal: 0, tecnicas: {}, lastSession: null }
    const u = sessionsByUser[s.user_id]
    u.total++
    if (s.completada) u.completadas++
    if (s.duracion_segundos) u.duracionTotal += s.duracion_segundos
    u.tecnicas[s.patron] = (u.tecnicas[s.patron] || 0) + 1
    if (!u.lastSession || s.created_at > u.lastSession) u.lastSession = s.created_at
  }

  return users.map((u: any) => {
    const stats = sessionsByUser[u.id] || { total: 0, completadas: 0, duracionTotal: 0, tecnicas: {}, lastSession: null }
    const topTecnica = Object.entries(stats.tecnicas).sort((a, b) => b[1] - a[1])[0]
    return {
      id: u.id, genero: u.genero, edad: u.edad, medicacion: u.medicacion,
      ciudad: u.localidad || u.ciudad, cp: u.cp, horas_sueno: u.horas_sueno,
      tecnica_favorita: u.tecnica_favorita, email: u.email, country: u.country,
      created_at: u.created_at,
      sesiones_total: stats.total, sesiones_completadas: stats.completadas,
      tasa_completacion: stats.total > 0 ? Math.round(stats.completadas * 1000 / stats.total) / 10 : 0,
      duracion_total: stats.duracionTotal, tecnicas_usadas: stats.tecnicas,
      tecnica_mas_usada: topTecnica ? topTecnica[0] : null, ultima_sesion: stats.lastSession,
    }
  })
}

// ══════════════════════════════════════════
// DASHBOARD AGGREGATIONS
// ══════════════════════════════════════════

export async function getDashboardSummary() {
  const users = await getUsers()
  const sess = await getAllSessions()
  const statsRow = await queryOne<{ total_sessions: number }>('SELECT total_sessions FROM global_stats WHERE id = 1')

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 86400000
  const completadas = sess.filter((s: any) => s.completada).length
  const durations = sess.filter((s: any) => s.duracion_segundos).map((s: any) => s.duracion_segundos)

  return {
    total_usuarios: users.length,
    total_sesiones: statsRow?.total_sessions || sess.length,
    total_ciudades: new Set(users.map((u: any) => (u.localidad || u.ciudad)?.toLowerCase().trim())).size,
    pct_medicacion: users.length > 0
      ? Math.round(users.filter((u: any) => u.medicacion === 'Sí, habitualmente').length * 1000 / users.length) / 10 : 0,
    nuevos_7dias: users.filter((u: any) => new Date(u.created_at).getTime() > sevenDaysAgo).length,
    sesiones_7dias: sess.filter((s: any) => new Date(s.created_at).getTime() > sevenDaysAgo).length,
    tasa_completacion: sess.length > 0 ? Math.round(completadas * 1000 / sess.length) / 10 : 0,
    duracion_media: durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0,
  }
}

export async function getByGenero() {
  const users = await getUsers()
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.genero] = (counts[u.genero] || 0) + 1
  const total = users.length || 1
  return Object.entries(counts).map(([genero, count]) => ({
    genero, total: count, porcentaje: Math.round(count * 1000 / total) / 10,
  })).sort((a, b) => b.total - a.total)
}

export async function getByEdad() {
  const users = await getUsers()
  const order = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+']
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.edad] = (counts[u.edad] || 0) + 1
  return order.filter(e => counts[e]).map(edad => ({ edad, total: counts[edad] }))
}

export async function getByMedicacion() {
  const users = await getUsers()
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.medicacion] = (counts[u.medicacion] || 0) + 1
  const total = users.length || 1
  return Object.entries(counts).map(([medicacion, count]) => ({
    medicacion, total: count, porcentaje: Math.round(count * 1000 / total) / 10,
  })).sort((a, b) => b.total - a.total)
}

export async function getByTecnica() {
  const users = await getUsers()
  const counts: Record<string, number> = {}
  for (const u of users) { if (u.tecnica_favorita) counts[u.tecnica_favorita] = (counts[u.tecnica_favorita] || 0) + 1 }
  return Object.entries(counts).map(([tecnica_favorita, total]) => ({ tecnica_favorita, total })).sort((a, b) => b.total - a.total)
}

export async function getByHoras() {
  const users = await getUsers()
  const order = ['Menos de 5h', '5–6h', '6–7h', '7–8h', 'Más de 8h']
  const counts: Record<string, number> = {}
  for (const u of users) counts[u.horas_sueno] = (counts[u.horas_sueno] || 0) + 1
  return order.filter(h => counts[h]).map(horas_sueno => ({ horas_sueno, total: counts[horas_sueno] }))
}

// ══════════════════════════════════════════
// SESSIONS AGGREGATIONS
// ══════════════════════════════════════════

export async function getSessionsSummary() {
  const sess = await getAllSessions()
  const total = sess.length
  const completadas = sess.filter((s: any) => s.completada).length
  const durations = sess.filter((s: any) => s.duracion_segundos).map((s: any) => s.duracion_segundos!)
  const now = Date.now()
  const today = new Date()
  return {
    total, completadas,
    tasa_completacion: total > 0 ? Math.round(completadas * 1000 / total) / 10 : 0,
    duracion_media: durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0,
    tiempo_total: durations.reduce((a: number, b: number) => a + b, 0),
    hoy: sess.filter((s: any) => { const d = new Date(s.created_at); return d.getUTCFullYear() === today.getUTCFullYear() && d.getUTCMonth() === today.getUTCMonth() && d.getUTCDate() === today.getUTCDate() }).length,
    ultimos_7d: sess.filter((s: any) => new Date(s.created_at).getTime() > now - 7 * 86400000).length,
    ultimos_30d: sess.filter((s: any) => new Date(s.created_at).getTime() > now - 30 * 86400000).length,
  }
}

export async function getSessionsByTecnica() {
  const sess = await getAllSessions()
  const byTecnica: Record<string, { count: number; completadas: number; duraciones: number[] }> = {}
  for (const s of sess) {
    if (!byTecnica[s.patron]) byTecnica[s.patron] = { count: 0, completadas: 0, duraciones: [] }
    byTecnica[s.patron].count++
    if (s.completada) byTecnica[s.patron].completadas++
    if (s.duracion_segundos) byTecnica[s.patron].duraciones.push(s.duracion_segundos)
  }
  return Object.entries(byTecnica).map(([tecnica, d]) => ({
    tecnica, count: d.count, completadas: d.completadas,
    tasa: d.count > 0 ? Math.round(d.completadas * 1000 / d.count) / 10 : 0,
    duracion_media: d.duraciones.length > 0 ? Math.round(d.duraciones.reduce((a, b) => a + b, 0) / d.duraciones.length) : 0,
  })).sort((a, b) => b.count - a.count)
}

export async function getSessionsByDay(days: number = 90) {
  const sess = await getAllSessions()
  const now = new Date()
  const map: Record<string, { count: number; completed: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    map[d.toISOString().slice(0, 10)] = { count: 0, completed: 0 }
  }
  for (const s of sess) {
    const key = new Date(s.created_at).toISOString().slice(0, 10)
    if (map[key]) { map[key].count++; if (s.completada) map[key].completed++ }
  }
  return Object.entries(map).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))
}

export async function getSessionsByHour() {
  const sess = await getAllSessions()
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
  for (const s of sess) hours[new Date(s.created_at).getUTCHours()].count++
  return hours
}

export async function getEngagementDistribution() {
  const sess = await getAllSessions()
  const userCounts: Record<string, number> = {}
  for (const s of sess) { if (s.user_id) userCounts[s.user_id] = (userCounts[s.user_id] || 0) + 1 }
  const buckets = [
    { bucket: '1', min: 1, max: 1, count: 0 },
    { bucket: '2-5', min: 2, max: 5, count: 0 },
    { bucket: '6-10', min: 6, max: 10, count: 0 },
    { bucket: '11+', min: 11, max: Infinity, count: 0 },
  ]
  for (const count of Object.values(userCounts)) {
    for (const b of buckets) { if (count >= b.min && count <= b.max) { b.count++; break } }
  }
  return buckets.map(({ bucket, count }) => ({ bucket, count }))
}

// ══════════════════════════════════════════
// CORRELATIONS
// ══════════════════════════════════════════

async function getUserSessionJoin() {
  const [users, sessions] = await Promise.all([getUsers(), getAllSessions()])
  const userMap = new Map(users.map((u: any) => [u.id, u]))
  return { users, sessions, userMap }
}

export async function getTecnicaByGenero() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id); if (!user) continue
    if (!result[user.genero]) result[user.genero] = {}
    result[user.genero][s.patron] = (result[user.genero][s.patron] || 0) + 1
  }
  return result
}

export async function getTecnicaByEdad() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id); if (!user) continue
    if (!result[user.edad]) result[user.edad] = {}
    result[user.edad][s.patron] = (result[user.edad][s.patron] || 0) + 1
  }
  return result
}

export async function getTecnicaByMedicacion() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id); if (!user) continue
    if (!result[user.medicacion]) result[user.medicacion] = {}
    result[user.medicacion][s.patron] = (result[user.medicacion][s.patron] || 0) + 1
  }
  return result
}

export async function getCompletionByMedicacion() {
  const { sessions, userMap } = await getUserSessionJoin()
  const data: Record<string, { total: number; completed: number }> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id); if (!user) continue
    if (!data[user.medicacion]) data[user.medicacion] = { total: 0, completed: 0 }
    data[user.medicacion].total++
    if (s.completada) data[user.medicacion].completed++
  }
  return Object.entries(data).map(([medicacion, d]) => ({
    medicacion, rate: d.total > 0 ? Math.round(d.completed * 1000 / d.total) / 10 : 0,
  }))
}

export async function getDuracionByEdad() {
  const { sessions, userMap } = await getUserSessionJoin()
  const data: Record<string, number[]> = {}
  for (const s of sessions) {
    if (!s.duracion_segundos) continue
    const user = userMap.get(s.user_id); if (!user) continue
    if (!data[user.edad]) data[user.edad] = []
    data[user.edad].push(s.duracion_segundos)
  }
  const order = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+']
  return order.filter(e => data[e]).map(edad => ({
    edad, avgDuration: Math.round(data[edad].reduce((a, b) => a + b, 0) / data[edad].length),
  }))
}

export async function getHorasSuenoByTecnica() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id); if (!user) continue
    if (!result[s.patron]) result[s.patron] = {}
    result[s.patron][user.horas_sueno] = (result[s.patron][user.horas_sueno] || 0) + 1
  }
  return result
}

export async function getMedicacionByHorasSueno() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id); if (!user) continue
    if (!result[user.horas_sueno]) result[user.horas_sueno] = {}
    result[user.horas_sueno][user.medicacion] = (result[user.horas_sueno][user.medicacion] || 0) + 1
  }
  return result
}

// ══════════════════════════════════════════
// GEOGRAPHIC
// ══════════════════════════════════════════

export async function getUsersByCountry() {
  const users = await getUsers()
  const counts: Record<string, number> = {}
  for (const u of users) { const c = u.country || 'Desconocido'; counts[c] = (counts[c] || 0) + 1 }
  return Object.entries(counts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count)
}

export async function getUsersByCiudad() {
  const users = await getUsers()
  const counts: Record<string, number> = {}
  for (const u of users) { const c = u.localidad || u.ciudad; counts[c] = (counts[c] || 0) + 1 }
  return Object.entries(counts).map(([ciudad, count]) => ({ ciudad, count })).sort((a, b) => b.count - a.count)
}

export async function getSessionsByCountry() {
  const { sessions, userMap } = await getUserSessionJoin()
  const counts: Record<string, number> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id); if (!user) continue
    counts[user.country || 'Desconocido'] = (counts[user.country || 'Desconocido'] || 0) + 1
  }
  return Object.entries(counts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count)
}

export async function getGeoTable() {
  const { users, sessions, userMap } = await getUserSessionJoin()
  const cityData: Record<string, { country: string; users: Set<string>; sessions: number; tecnicas: Record<string, number> }> = {}
  for (const u of users) {
    const c = u.localidad || u.ciudad
    if (!cityData[c]) cityData[c] = { country: u.country || 'ES', users: new Set(), sessions: 0, tecnicas: {} }
    cityData[c].users.add(u.id)
  }
  for (const s of sessions) {
    const user = userMap.get(s.user_id)
    const c = user?.localidad || user?.ciudad
    if (!user || !c || !cityData[c]) continue
    cityData[c].sessions++
    cityData[c].tecnicas[s.patron] = (cityData[c].tecnicas[s.patron] || 0) + 1
  }
  return Object.entries(cityData).map(([ciudad, d]) => {
    const top = Object.entries(d.tecnicas).sort((a, b) => b[1] - a[1])[0]
    return { ciudad, country: d.country, usuarios: d.users.size, sesiones: d.sessions, tecnica_top: top ? top[0] : '–' }
  }).sort((a, b) => b.usuarios - a.usuarios)
}

// ══════════════════════════════════════════
// BLOG
// ══════════════════════════════════════════

function blogRowToPost(row: any): BlogPost {
  return {
    id: row.id, title: row.titulo, slug: row.slug,
    image_url: row.imagen_url || '', description: row.extracto || '',
    body: row.contenido || '', published: row.publicado,
    created_at: row.created_at, updated_at: row.updated_at,
  }
}

export async function insertBlogPost(data: Omit<BlogPost, 'id' | 'slug' | 'created_at' | 'updated_at'>): Promise<BlogPost> {
  await ensureReady()
  const row = await queryOne(
    `INSERT INTO blog_posts (titulo, slug, extracto, contenido, imagen_url, publicado)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.title, slugify(data.title), data.description, data.body, data.image_url, data.published]
  )
  if (!row) throw new Error('Insert blog post returned no row')
  return blogRowToPost(row)
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  await ensureReady()
  const rows = await query('SELECT * FROM blog_posts ORDER BY created_at DESC')
  return rows.map(blogRowToPost)
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  await ensureReady()
  const rows = await query('SELECT * FROM blog_posts WHERE publicado = true ORDER BY created_at DESC')
  return rows.map(blogRowToPost)
}

export async function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  await ensureReady()
  const row = await queryOne('SELECT * FROM blog_posts WHERE id = $1', [id])
  return row ? blogRowToPost(row) : undefined
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  await ensureReady()
  const row = await queryOne('SELECT * FROM blog_posts WHERE slug = $1 AND publicado = true', [slug])
  return row ? blogRowToPost(row) : undefined
}

export async function updateBlogPost(id: string, updates: Partial<Omit<BlogPost, 'id' | 'slug' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  await ensureReady()
  const sets: string[] = ['updated_at = NOW()']
  const vals: any[] = [id]
  let i = 2
  if (updates.title !== undefined) { sets.push(`titulo = $${i}`, `slug = $${i+1}`); vals.push(updates.title, slugify(updates.title)); i += 2 }
  if (updates.description !== undefined) { sets.push(`extracto = $${i++}`); vals.push(updates.description) }
  if (updates.body !== undefined) { sets.push(`contenido = $${i++}`); vals.push(updates.body) }
  if (updates.image_url !== undefined) { sets.push(`imagen_url = $${i++}`); vals.push(updates.image_url) }
  if (updates.published !== undefined) { sets.push(`publicado = $${i++}`); vals.push(updates.published) }
  await query(`UPDATE blog_posts SET ${sets.join(', ')} WHERE id = $1`, vals)
  return true
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  await ensureReady()
  await query('DELETE FROM blog_posts WHERE id = $1', [id])
  return true
}

// ══════════════════════════════════════════
// RETREATS
// ══════════════════════════════════════════

function retreatRowToRetreat(row: any): Retreat {
  return {
    id: row.id, title: row.nombre, description: row.descripcion || '',
    ubicacion: row.ubicacion || '',
    fecha_inicio: row.fecha_inicio || '', fecha_fin: row.fecha_fin || row.fecha_inicio || '',
    price: Number(row.precio) || 0, plazas: Number(row.plazas) || 0,
    image_url: row.imagen_url || '', published: row.activo, created_at: row.created_at,
  }
}

export async function insertRetreat(data: Omit<Retreat, 'id' | 'created_at'>): Promise<Retreat> {
  await ensureReady()
  const row = await queryOne(
    `INSERT INTO retreats (nombre, descripcion, ubicacion, fecha_inicio, fecha_fin, precio, plazas, imagen_url, activo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.title, data.description, data.ubicacion || '', data.fecha_inicio, data.fecha_fin,
     data.price, data.plazas || 0, data.image_url, data.published]
  )
  if (!row) throw new Error('Insert retreat returned no row')
  return retreatRowToRetreat(row)
}

export async function getRetreats(): Promise<Retreat[]> {
  await ensureReady()
  return (await query('SELECT * FROM retreats ORDER BY created_at DESC')).map(retreatRowToRetreat)
}

export async function getPublishedRetreats(): Promise<Retreat[]> {
  await ensureReady()
  return (await query('SELECT * FROM retreats WHERE activo = true ORDER BY fecha_inicio ASC')).map(retreatRowToRetreat)
}

export async function getRetreatById(id: string): Promise<Retreat | undefined> {
  await ensureReady()
  const row = await queryOne('SELECT * FROM retreats WHERE id = $1', [id])
  return row ? retreatRowToRetreat(row) : undefined
}

export async function updateRetreat(id: string, updates: Partial<Omit<Retreat, 'id' | 'created_at'>>): Promise<boolean> {
  await ensureReady()
  const sets: string[] = []
  const vals: any[] = [id]
  let i = 2
  if (updates.title !== undefined) { sets.push(`nombre = $${i++}`); vals.push(updates.title) }
  if (updates.description !== undefined) { sets.push(`descripcion = $${i++}`); vals.push(updates.description) }
  if (updates.fecha_inicio !== undefined) { sets.push(`fecha_inicio = $${i++}`); vals.push(updates.fecha_inicio) }
  if (updates.fecha_fin !== undefined) { sets.push(`fecha_fin = $${i++}`); vals.push(updates.fecha_fin) }
  if (updates.price !== undefined) { sets.push(`precio = $${i++}`); vals.push(updates.price) }
  if (updates.plazas !== undefined) { sets.push(`plazas = $${i++}`); vals.push(updates.plazas) }
  if (updates.ubicacion !== undefined) { sets.push(`ubicacion = $${i++}`); vals.push(updates.ubicacion) }
  if (updates.image_url !== undefined) { sets.push(`imagen_url = $${i++}`); vals.push(updates.image_url) }
  if (updates.published !== undefined) { sets.push(`activo = $${i++}`); vals.push(updates.published) }
  if (sets.length === 0) return false
  await query(`UPDATE retreats SET ${sets.join(', ')} WHERE id = $1`, vals)
  return true
}

export async function deleteRetreat(id: string): Promise<boolean> {
  await ensureReady()
  await query('DELETE FROM retreats WHERE id = $1', [id])
  return true
}

// ══════════════════════════════════════════
// RETREAT REGISTRATIONS
// ══════════════════════════════════════════

export async function getRetreatRegistrationCount(retreatId: string): Promise<number> {
  await ensureReady()
  const row = await queryOne<{ count: string }>('SELECT COUNT(*)::text AS count FROM retreat_registrations WHERE retreat_id = $1', [retreatId])
  return parseInt(row?.count || '0', 10)
}

export async function getUserRetreatRegistrations(userId: string): Promise<string[]> {
  await ensureReady()
  const rows = await query<{ retreat_id: string }>('SELECT retreat_id FROM retreat_registrations WHERE user_id = $1', [userId])
  return rows.map(r => r.retreat_id)
}

export async function registerForRetreat(userId: string, retreatId: string, contact: { nombre: string; apellidos: string; email: string; telefono: string }): Promise<{ id: string }> {
  const retreat = await getRetreatById(retreatId)
  if (!retreat) throw Object.assign(new Error('Retiro no encontrado'), { status: 404 })

  if (retreat.plazas > 0) {
    const count = await getRetreatRegistrationCount(retreatId)
    if (count >= retreat.plazas) throw Object.assign(new Error('No quedan plazas disponibles'), { status: 409 })
  }

  try {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO retreat_registrations (user_id, retreat_id, nombre, apellidos, email, telefono)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userId, retreatId, contact.nombre, contact.apellidos, contact.email, contact.telefono]
    )
    if (!row) throw new Error('Insert failed')
    return { id: row.id }
  } catch (err: any) {
    if (err.code === '23505') throw Object.assign(new Error('Ya estás inscrito en este retiro'), { status: 409 })
    throw err
  }
}

export async function getRetreatRegistrations(retreatId: string): Promise<RetreatRegistration[]> {
  await ensureReady()
  return query<RetreatRegistration>('SELECT * FROM retreat_registrations WHERE retreat_id = $1 ORDER BY created_at ASC', [retreatId])
}
