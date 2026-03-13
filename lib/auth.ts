// lib/auth.ts — Shared auth check supporting both cookie and Bearer token
import { NextRequest } from 'next/server'

export function authCheck(req: NextRequest): boolean {
  // 1. Check Bearer token header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (token === process.env.ADMIN_SECRET) return true
  }
  // 2. Fallback to cookie (backwards compat)
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}
