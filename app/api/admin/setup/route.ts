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

  // 1. Check and add email columns to users
  const { error: colCheck } = await sb.from('users').select('email').limit(0)
  if (colCheck && colCheck.message.includes('email')) {
    // Column doesn't exist — use rpc to run ALTER TABLE
    const { error: alterErr } = await sb.rpc('exec_sql', {
      query: "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT; ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consiente_email BOOLEAN DEFAULT false;"
    })
    if (alterErr) {
      results.push(`email columns: FAILED (${alterErr.message}) — run manually in Supabase SQL Editor`)
    } else {
      results.push('email columns: added')
    }
  } else {
    results.push('email columns: already exist')
  }

  // 2. Ensure storage bucket exists
  const { data: buckets } = await sb.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.id === 'images')
  if (!bucketExists) {
    const { error: bucketErr } = await sb.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
      fileSizeLimit: 5 * 1024 * 1024,
    })
    if (bucketErr) {
      results.push(`storage bucket: FAILED (${bucketErr.message})`)
    } else {
      results.push('storage bucket: created')
    }
  } else {
    results.push('storage bucket: already exists')
  }

  return NextResponse.json({ results })
}
