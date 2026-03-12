// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { insertUser, getUsers, updateUser } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { genero, edad, medicacion, localidad, horas_sueno, tecnica_favorita } = body

    if (!genero || !edad || !medicacion || !localidad?.trim() || !horas_sueno) {
      return NextResponse.json({ error: 'Campos requeridos incompletos' }, { status: 400 })
    }

    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ip = forwarded.split(',')[0].trim() || 'unknown'
    const ipHash = createHash('sha256')
      .update(ip + (process.env.IP_SALT || 'breathe-salt'))
      .digest('hex')
      .slice(0, 16)

    const result = insertUser({
      genero,
      edad,
      medicacion,
      localidad: localidad.trim(),
      horas_sueno,
      tecnica_favorita: tecnica_favorita || null,
      ip_hash: ipHash,
      country: req.headers.get('x-vercel-ip-country') || null,
      user_agent: (req.headers.get('user-agent') || '').slice(0, 200),
    })

    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/users] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth || auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const data = getUsers()
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, genero, edad, medicacion, localidad, horas_sueno } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const validGenero = ['Hombre', 'Mujer', 'Otro']
    const validEdad = ['18\u201324', '25\u201334', '35\u201344', '45\u201354', '55\u201364', '65+']
    const validMedicacion = ['S\u00ed, habitualmente', 'A veces', 'No']
    const validHoras = ['Menos de 5h', '5\u20136h', '6\u20137h', '7\u20138h', 'M\u00e1s de 8h']

    if (genero && !validGenero.includes(genero)) return NextResponse.json({ error: 'G\u00e9nero inv\u00e1lido' }, { status: 400 })
    if (edad && !validEdad.includes(edad)) return NextResponse.json({ error: 'Edad inv\u00e1lida' }, { status: 400 })
    if (medicacion && !validMedicacion.includes(medicacion)) return NextResponse.json({ error: 'Medicaci\u00f3n inv\u00e1lida' }, { status: 400 })
    if (horas_sueno && !validHoras.includes(horas_sueno)) return NextResponse.json({ error: 'Horas inv\u00e1lidas' }, { status: 400 })

    const updates: Record<string, string> = {}
    if (genero) updates.genero = genero
    if (edad) updates.edad = edad
    if (medicacion) updates.medicacion = medicacion
    if (localidad?.trim()) updates.localidad = localidad.trim()
    if (horas_sueno) updates.horas_sueno = horas_sueno

    const ok = updateUser(userId, updates)
    if (!ok) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/users] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
