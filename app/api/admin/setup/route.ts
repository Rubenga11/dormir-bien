// app/api/admin/setup/route.ts — Auto-migration endpoint
import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/server'
import { authCheck } from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sb = createAdminClient()
  const results: string[] = []

  // 1. Check email columns
  const { error: colCheck } = await sb.from('users').select('email').limit(0)
  if (colCheck && colCheck.message.includes('email')) {
    results.push('email columns: MISSING — need ALTER TABLE in Supabase SQL Editor')
  } else {
    results.push('email columns: already exist')
  }

  // 2. Migrate retreats: fecha → fecha_inicio + fecha_fin
  const { error: colCheck2 } = await sb.from('retreats').select('fecha_inicio').limit(0)
  if (colCheck2 && colCheck2.message.includes('fecha_inicio')) {
    // Column doesn't exist yet — run migration via REST SQL
    const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY!
    try {
      const sql = `
        ALTER TABLE retreats RENAME COLUMN fecha TO fecha_inicio;
        ALTER TABLE retreats ADD COLUMN IF NOT EXISTS fecha_fin DATE;
        UPDATE retreats SET fecha_fin = fecha_inicio WHERE fecha_fin IS NULL;
      `
      const migRes = await fetch(`${supabaseUrl2}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: { 'apikey': serviceKey2, 'Authorization': `Bearer ${serviceKey2}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      })
      if (migRes.ok) {
        results.push('retreats migration: fecha → fecha_inicio/fecha_fin applied')
      } else {
        // RPC may not exist, try raw SQL via pg_net or just note it
        results.push('retreats migration: RPC not available — run SQL manually: ALTER TABLE retreats RENAME COLUMN fecha TO fecha_inicio; ALTER TABLE retreats ADD COLUMN fecha_fin DATE; UPDATE retreats SET fecha_fin = fecha_inicio WHERE fecha_fin IS NULL;')
      }
    } catch (err2: unknown) {
      const msg2 = err2 instanceof Error ? err2.message : String(err2)
      results.push(`retreats migration error: ${msg2}`)
    }
  } else {
    results.push('retreats fecha_inicio column: already exists')
  }

  // 3. Ensure storage bucket — use direct REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  try {
    // List buckets
    const listRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    })
    const buckets = await listRes.json()
    results.push(`storage list: ${listRes.status} — ${JSON.stringify(buckets)}`)

    const exists = Array.isArray(buckets) && buckets.some((b: { id: string }) => b.id === 'images')

    if (!exists) {
      const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'images',
          name: 'images',
          public: true,
          allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
          file_size_limit: 5242880
        })
      })
      const createBody = await createRes.text()
      results.push(`storage create: ${createRes.status} — ${createBody}`)
    } else {
      results.push('storage bucket: already exists')
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    results.push(`storage error: ${msg}`)
  }

  return NextResponse.json({ results })
}
