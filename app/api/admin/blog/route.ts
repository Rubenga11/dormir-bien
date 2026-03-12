// app/api/admin/blog/route.ts — CRUD admin blog
import { NextRequest, NextResponse } from 'next/server'
import { getBlogPosts, getBlogPostById, insertBlogPost, updateBlogPost, deleteBlogPost } from '@/lib/db'

function authCheck(req: NextRequest): boolean {
  const cookie = req.cookies.get('breathe-admin-token')
  return cookie?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await getBlogPosts())
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const post = await insertBlogPost({
    title: body.title || '',
    image_url: body.image_url || '',
    description: body.description || '',
    body: body.body || '',
    published: body.published ?? false,
  })
  return NextResponse.json(post, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const ok = await updateBlogPost(body.id, body)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(await getBlogPostById(body.id))
}

export async function DELETE(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const ok = await deleteBlogPost(id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
