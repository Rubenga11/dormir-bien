// app/api/admin/setup/route.ts — Database health check and migration trigger
import { NextRequest, NextResponse } from 'next/server'
import { authCheck } from '@/lib/auth'
import { query } from '@/lib/postgres/pool'
import { runMigrations } from '@/lib/postgres/migrate'

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const results: string[] = []

  try {
    await runMigrations()
    results.push('migrations: OK')
  } catch (err: any) {
    results.push(`migrations: FAILED — ${err.message}`)
  }

  try {
    const [users] = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users')
    const [sessions] = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM sessions')
    const [posts] = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM blog_posts')
    results.push(`users: ${users.count}, sessions: ${sessions.count}, blog_posts: ${posts.count}`)
  } catch (err: any) {
    results.push(`health check: FAILED — ${err.message}`)
  }

  return NextResponse.json({ results })
}
