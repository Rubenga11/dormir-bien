import { NextResponse } from 'next/server'
import { getUserById, getSessionsByUser } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const user = await getUserById(id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const sessions = await getSessionsByUser(id)

  const completadas = sessions.filter((s: { completada: boolean }) => s.completada)
  const tecnicas_usadas: Record<string, number> = {}
  for (const s of sessions) {
    tecnicas_usadas[s.patron] = (tecnicas_usadas[s.patron] || 0) + 1
  }

  let tecnica_favorita: string | null = null
  let maxCount = 0
  for (const [patron, count] of Object.entries(tecnicas_usadas)) {
    if (count > maxCount) { maxCount = count; tecnica_favorita = patron }
  }

  const ultima_sesion = sessions.length > 0
    ? sessions.sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].created_at
    : null

  return NextResponse.json({
    tecnica_favorita: tecnica_favorita || user.tecnica_favorita || null,
    sesiones_total: sessions.length,
    sesiones_completadas: completadas.length,
    ultima_sesion,
    tecnicas_usadas,
  })
}
