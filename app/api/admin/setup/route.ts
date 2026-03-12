// app/api/admin/setup/route.ts — Auto-migration endpoint
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function authCheck(req: NextRequest): boolean {
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}

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

  // 2. Ensure storage bucket — use direct REST API
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
