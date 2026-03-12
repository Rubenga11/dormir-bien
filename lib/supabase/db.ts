// lib/supabase/db.ts — Implementación real con Supabase
import { createAdminClient } from './server'
import type { NombrePatron, BlogPost, Retreat } from '@/types'

function sb() { return createAdminClient() }

// ── Helpers
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
  const row_data: Record<string, unknown> = {
    genero: data.genero, edad: data.edad, medicacion: data.medicacion,
    ciudad: data.ciudad, cp: data.cp, horas_sueno: data.horas_sueno,
    tecnica_favorita: data.tecnica_favorita || null,
    ip_hash: data.ip_hash || null, user_agent: data.user_agent || null,
    country: data.country || null,
  }
  if (data.email) row_data.email = data.email
  if (data.consiente_email !== undefined) row_data.consiente_email = data.consiente_email
  const { data: row, error } = await sb().from('users').insert(row_data).select('id').single()
  if (error && (error.message?.includes('email') || error.message?.includes('consiente'))) {
    // Retry without email columns if they don't exist yet
    delete row_data.email
    delete row_data.consiente_email
    const { data: row2, error: error2 } = await sb().from('users').insert(row_data).select('id').single()
    if (error2) throw error2
    return { id: row2.id }
  }
  if (error) throw error
  return { id: row.id }
}

export async function getUsers() {
  const { data, error } = await sb().from('users').select('*').order('created_at', { ascending: false })
  if (error) { console.error('getUsers error:', error.message); return [] }
  return data
}

export async function getUserById(id: string) {
  const { data, error } = await sb().from('users').select('*').eq('id', id).single()
  if (error) return undefined
  return data
}

export async function updateUser(id: string, updates: Record<string, unknown>): Promise<boolean> {
  const { error } = await sb().from('users').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
  return !error
}

// ══════════════════════════════════════════
// SESSIONS
// ══════════════════════════════════════════

export async function insertSession(data: {
  user_id?: string | null; patron: string; duracion_segundos?: number | null; completada?: boolean
}): Promise<void> {
  await sb().from('sessions').insert({
    user_id: data.user_id || null, patron: data.patron,
    duracion_segundos: data.duracion_segundos || null, completada: data.completada || false,
  })
  // increment global counter
  await sb().rpc('increment_sessions')
}

export async function getSessionsByUser(userId: string) {
  const { data } = await sb().from('sessions').select('*').eq('user_id', userId)
  return data || []
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
  const { data } = await sb().from('sessions').select('*').order('created_at', { ascending: false })
  return data || []
}

// ══════════════════════════════════════════
// DASHBOARD AGGREGATIONS
// ══════════════════════════════════════════

export async function getDashboardSummary() {
  const users = await getUsers()
  const { data: sessions, error: sessErr } = await sb().from('sessions').select('*')
  if (sessErr) console.error('getDashboardSummary sessions error:', sessErr.message)
  const sess = sessions || []
  const { data: stats } = await sb().from('global_stats').select('total_sessions').eq('id', 1).single()

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 86400000
  const completadas = sess.filter((s: any) => s.completada).length
  const durations = sess.filter((s: any) => s.duracion_segundos).map((s: any) => s.duracion_segundos)

  return {
    total_usuarios: users.length,
    total_sesiones: stats?.total_sessions || sess.length,
    total_ciudades: new Set(users.map((u: any) => u.ciudad?.toLowerCase().trim())).size,
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
    const key = s.created_at.slice(0, 10)
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
    const user = userMap.get(s.user_id)
    if (!user) continue
    if (!result[user.genero]) result[user.genero] = {}
    result[user.genero][s.patron] = (result[user.genero][s.patron] || 0) + 1
  }
  return result
}

export async function getTecnicaByEdad() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id)
    if (!user) continue
    if (!result[user.edad]) result[user.edad] = {}
    result[user.edad][s.patron] = (result[user.edad][s.patron] || 0) + 1
  }
  return result
}

export async function getTecnicaByMedicacion() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id)
    if (!user) continue
    if (!result[user.medicacion]) result[user.medicacion] = {}
    result[user.medicacion][s.patron] = (result[user.medicacion][s.patron] || 0) + 1
  }
  return result
}

export async function getCompletionByMedicacion() {
  const { sessions, userMap } = await getUserSessionJoin()
  const data: Record<string, { total: number; completed: number }> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id)
    if (!user) continue
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
    const user = userMap.get(s.user_id)
    if (!user) continue
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
    const user = userMap.get(s.user_id)
    if (!user) continue
    if (!result[s.patron]) result[s.patron] = {}
    result[s.patron][user.horas_sueno] = (result[s.patron][user.horas_sueno] || 0) + 1
  }
  return result
}

export async function getMedicacionByHorasSueno() {
  const { sessions, userMap } = await getUserSessionJoin()
  const result: Record<string, Record<string, number>> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id)
    if (!user) continue
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
  for (const u of users) counts[u.ciudad] = (counts[u.ciudad] || 0) + 1
  return Object.entries(counts).map(([ciudad, count]) => ({ ciudad, count })).sort((a, b) => b.count - a.count)
}

export async function getSessionsByCountry() {
  const { sessions, userMap } = await getUserSessionJoin()
  const counts: Record<string, number> = {}
  for (const s of sessions) {
    const user = userMap.get(s.user_id)
    if (!user) continue
    const c = user.country || 'Desconocido'
    counts[c] = (counts[c] || 0) + 1
  }
  return Object.entries(counts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count)
}

export async function getGeoTable() {
  const { users, sessions, userMap } = await getUserSessionJoin()
  const cityData: Record<string, { country: string; users: Set<string>; sessions: number; tecnicas: Record<string, number> }> = {}
  for (const u of users) {
    if (!cityData[u.ciudad]) cityData[u.ciudad] = { country: u.country || 'ES', users: new Set(), sessions: 0, tecnicas: {} }
    cityData[u.ciudad].users.add(u.id)
  }
  for (const s of sessions) {
    const user = userMap.get(s.user_id)
    if (!user || !cityData[user.ciudad]) continue
    cityData[user.ciudad].sessions++
    cityData[user.ciudad].tecnicas[s.patron] = (cityData[user.ciudad].tecnicas[s.patron] || 0) + 1
  }
  return Object.entries(cityData).map(([ciudad, d]) => {
    const top = Object.entries(d.tecnicas).sort((a, b) => b[1] - a[1])[0]
    return { ciudad, country: d.country, usuarios: d.users.size, sesiones: d.sessions, tecnica_top: top ? top[0] : '–' }
  }).sort((a, b) => b.usuarios - a.usuarios)
}

// ══════════════════════════════════════════
// BLOG
// ══════════════════════════════════════════

export async function insertBlogPost(data: Omit<BlogPost, 'id' | 'slug' | 'created_at' | 'updated_at'>): Promise<BlogPost> {
  const { data: row, error } = await sb().from('blog_posts').insert({
    ...data, slug: slugify(data.title),
  }).select().single()
  if (error) throw error
  return row
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const { data } = await sb().from('blog_posts').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const { data } = await sb().from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false })
  return data || []
}

export async function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  const { data } = await sb().from('blog_posts').select('*').eq('id', id).single()
  return data || undefined
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const { data } = await sb().from('blog_posts').select('*').eq('slug', slug).eq('published', true).single()
  return data || undefined
}

export async function updateBlogPost(id: string, updates: Partial<Omit<BlogPost, 'id' | 'slug' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const patch: any = { ...updates, updated_at: new Date().toISOString() }
  if (updates.title) patch.slug = slugify(updates.title)
  const { error } = await sb().from('blog_posts').update(patch).eq('id', id)
  return !error
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const { error } = await sb().from('blog_posts').delete().eq('id', id)
  return !error
}

// ══════════════════════════════════════════
// RETREATS
// ══════════════════════════════════════════

export async function insertRetreat(data: Omit<Retreat, 'id' | 'created_at' | 'updated_at'>): Promise<Retreat> {
  const { data: row, error } = await sb().from('retreats').insert(data).select().single()
  if (error) throw error
  return row
}

export async function getRetreats(): Promise<Retreat[]> {
  const { data } = await sb().from('retreats').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function getPublishedRetreats(): Promise<Retreat[]> {
  const { data } = await sb().from('retreats').select('*').eq('published', true).order('start_date', { ascending: true })
  return data || []
}

export async function getRetreatById(id: string): Promise<Retreat | undefined> {
  const { data } = await sb().from('retreats').select('*').eq('id', id).single()
  return data || undefined
}

export async function updateRetreat(id: string, updates: Partial<Omit<Retreat, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const { error } = await sb().from('retreats').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
  return !error
}

export async function deleteRetreat(id: string): Promise<boolean> {
  const { error } = await sb().from('retreats').delete().eq('id', id)
  return !error
}
