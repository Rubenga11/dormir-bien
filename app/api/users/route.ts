// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }
import { createHash } from 'crypto'
import { insertUser, getUsers, updateUser } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { genero, edad, medicacion, ciudad, cp, horas_sueno, email, consiente_email, tecnica_favorita } = body

    if (!genero || !edad || !medicacion || !ciudad?.trim() || !cp?.trim() || !horas_sueno) {
      return NextResponse.json({ error: 'Campos requeridos incompletos' }, { status: 400 })
    }

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ip = forwarded.split(',')[0].trim() || 'unknown'
    const ipHash = createHash('sha256')
      .update(ip + (process.env.IP_SALT || 'breathe-salt'))
      .digest('hex')
      .slice(0, 16)

    const result = await insertUser({
      genero,
      edad,
      medicacion,
      ciudad: ciudad.trim(),
      cp: cp.trim(),
      horas_sueno,
      email: email.trim(),
      consiente_email: !!consiente_email,
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

  const data = await getUsers()
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, genero, edad, medicacion, ciudad, cp, horas_sueno, email, consiente_email } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const validGenero = ['Hombre', 'Mujer', 'Otro']
    const validEdad = ['18\u201324', '25\u201334', '35\u201344', '45\u201354', '55\u201364', '65+']
    const validMedicacion = ['S\u00ed, habitualmente', 'A veces', 'No']
    const validHoras = ['Menos de 5h', '5\u20136h', '6\u20137h', '7\u20138h', 'M\u00e1s de 8h']

    if (genero && !validGenero.includes(genero)) return NextResponse.json({ error: 'Género inválido' }, { status: 400 })
    if (edad && !validEdad.includes(edad)) return NextResponse.json({ error: 'Edad inválida' }, { status: 400 })
    if (medicacion && !validMedicacion.includes(medicacion)) return NextResponse.json({ error: 'Medicación inválida' }, { status: 400 })
    if (horas_sueno && !validHoras.includes(horas_sueno)) return NextResponse.json({ error: 'Horas inválidas' }, { status: 400 })
    if (email !== undefined && (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const updates: Record<string, string | boolean> = {}
    if (genero) updates.genero = genero
    if (edad) updates.edad = edad
    if (medicacion) updates.medicacion = medicacion
    if (ciudad?.trim()) updates.ciudad = ciudad.trim()
    if (cp?.trim()) updates.cp = cp.trim()
    if (horas_sueno) updates.horas_sueno = horas_sueno
    if (email !== undefined) updates.email = email.trim()
    if (consiente_email !== undefined) updates.consiente_email = !!consiente_email

    const ok = await updateUser(userId, updates)
    if (!ok) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/users] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
