// app/api/export/json/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUsers } from '@/lib/db'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('breathe-admin-token')
  if (cookie?.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const data = getUsers()
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="breathe_datos_${date}.json"`,
    },
  })
}
