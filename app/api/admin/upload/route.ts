// app/api/admin/upload/route.ts — Upload de imágenes via Supabase Storage
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

function authCheck(req: NextRequest): boolean {
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const BUCKET = 'images'

let bucketReady = false

async function ensureBucket(sb: ReturnType<typeof createAdminClient>) {
  if (bucketReady) return
  const { data } = await sb.storage.listBuckets()
  if (!data?.some(b => b.id === BUCKET)) {
    await sb.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ALLOWED_TYPES,
      fileSizeLimit: MAX_SIZE,
    })
  }
  bucketReady = true
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Tipo no permitido. Usa PNG, JPG, WebP o PDF.' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Archivo demasiado grande (máx 5 MB)' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const filename = `${randomUUID()}.${ext}`

    const sb = createAdminClient()
    await ensureBucket(sb)

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await sb.storage.from(BUCKET).upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error('[upload] Supabase Storage error:', error.message)
      return NextResponse.json({ error: `Error subiendo archivo: ${error.message}` }, { status: 500 })
    }

    const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(filename)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado al subir archivo'
    console.error('[upload] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
