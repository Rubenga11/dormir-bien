// lib/postgres/pool.ts — Singleton connection pool for PostgreSQL
import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    // Support both DATABASE_URL and individual env vars (from ECS Secrets Manager)
    const connectionString = process.env.DATABASE_URL
      || (process.env.DB_HOST
        ? `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'breathe'}`
        : '')
    if (!connectionString) {
      throw new Error('DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD environment variables are required')
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    })
    pool.on('error', (err) => {
      console.error('[pg pool] Unexpected error on idle client:', err.message)
    })
  }
  return pool
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const { rows } = await getPool().query(text, params)
  return rows as T[]
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | undefined> {
  const rows = await query<T>(text, params)
  return rows[0]
}
