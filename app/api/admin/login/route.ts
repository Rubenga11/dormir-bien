// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseJsonBody } from '@/lib/parse-body'

export async function POST(req: NextRequest) {
  const { password } = await parseJsonBody(req)

  if (!password || password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, token: process.env.ADMIN_SECRET })
  // Cookie for backwards compat (same-origin)
  res.cookies.set('breathe-admin-token', process.env.ADMIN_SECRET!, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 8, // 8 horas
    path:     '/',
  })
  return res
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
