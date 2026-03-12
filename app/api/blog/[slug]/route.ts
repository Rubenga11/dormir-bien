// app/api/blog/[slug]/route.ts — GET público: post individual por slug
import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostBySlug } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(post)
}
