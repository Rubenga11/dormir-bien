// app/api/blog/route.ts — GET público: posts publicados
import { NextResponse } from 'next/server'
import { getPublishedBlogPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getPublishedBlogPosts())
}
