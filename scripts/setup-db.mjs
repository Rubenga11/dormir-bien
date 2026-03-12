#!/usr/bin/env node
/**
 * setup-db.mjs — Execute SQL migrations against Supabase
 *
 * Usage:
 *   1. Get your access token: npx supabase login
 *      (or go to https://supabase.com/dashboard/account/tokens)
 *   2. Run: SUPABASE_ACCESS_TOKEN=<token> node scripts/setup-db.mjs
 *
 *   Or paste the SQL manually at:
 *   https://supabase.com/dashboard/project/ocbuirziiiiunfgxnzaum/sql/new
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'ocbuirziiiiunfgxnzaum'

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not set.\n')
  console.error('Get one at: https://supabase.com/dashboard/account/tokens')
  console.error('Then run:   SUPABASE_ACCESS_TOKEN=<token> node scripts/setup-db.mjs')
  process.exit(1)
}

const migrations = [
  join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
  join(__dirname, '..', 'supabase', 'migrations', '002_blog_retreats.sql'),
]

async function runSQL(sql, name) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    console.error(`❌ ${name} failed (${res.status}):`, body)
    return false
  }

  console.log(`✅ ${name} executed successfully`)
  return true
}

console.log('🚀 Running Supabase migrations...\n')

let allOk = true
for (const file of migrations) {
  const name = file.split(/[/\\]/).pop()
  const sql = readFileSync(file, 'utf-8')
  const ok = await runSQL(sql, name)
  if (!ok) allOk = false
}

if (allOk) {
  console.log('\n✅ All migrations completed successfully!')
} else {
  console.log('\n⚠️  Some migrations failed. Check errors above.')
  console.log('You can also paste the SQL manually at:')
  console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`)
  process.exit(1)
}
