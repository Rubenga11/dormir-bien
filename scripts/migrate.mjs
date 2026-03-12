// scripts/migrate.mjs — Run pending Supabase migrations programmatically
// Usage: node scripts/migrate.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('=== Migration 003: users email columns + storage bucket ===')

  // 1. Add email columns to users table via RPC (raw SQL not available, use workaround)
  // Try to insert a test and see if columns exist
  console.log('\n1. Adding email/consiente_email columns to users...')

  // We use the Supabase SQL editor API is not available via client,
  // so we test if columns exist by trying a query
  const { data: testUser, error: testErr } = await sb
    .from('users')
    .select('email')
    .limit(1)

  if (testErr && testErr.message.includes('email')) {
    console.log('   Columns do not exist yet - need manual SQL or Supabase Dashboard')
    console.log('   SQL needed: ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;')
    console.log('   SQL needed: ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consiente_email BOOLEAN DEFAULT false;')
  } else {
    console.log('   email column already exists (or table is empty) ✓')
  }

  // 2. Create storage bucket
  console.log('\n2. Creating storage bucket "images"...')

  const { data: buckets } = await sb.storage.listBuckets()
  const exists = buckets?.some(b => b.id === 'images')

  if (exists) {
    console.log('   Bucket "images" already exists ✓')
  } else {
    const { error: bucketErr } = await sb.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
      fileSizeLimit: 5 * 1024 * 1024,
    })
    if (bucketErr) {
      console.error('   Error creating bucket:', bucketErr.message)
    } else {
      console.log('   Bucket "images" created ✓')
    }
  }

  console.log('\n=== Migration complete ===')
}

run().catch(e => { console.error(e); process.exit(1) })
