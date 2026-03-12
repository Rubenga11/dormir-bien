// app/api/blog/route.ts — GET público: posts publicados
import { NextResponse } from 'next/server'
import { getPublishedBlogPosts } from '@/lib/db'

export async function GET() {
  return NextResponse.json(getPublishedBlogPosts())
}
