// middleware.ts — Handle CORS preflight for all API routes
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://breathecalm.es',
  'https://www.breathecalm.es',
  'https://dev.breathecalm.es',
]

function getCorsOrigin(req: NextRequest): string {
  const origin = req.headers.get('origin') || ''
  if (ALLOWED_ORIGINS.includes(origin)) return origin
  // In development, allow localhost
  if (origin.startsWith('http://localhost:')) return origin
  // Fallback to env var or restrictive default
  return process.env.CORS_ORIGIN || ALLOWED_ORIGINS[0]
}

export function middleware(req: NextRequest) {
  // Only intercept API routes
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  const corsOrigin = getCorsOrigin(req)

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // For actual requests, add CORS headers to response
  const res = NextResponse.next()
  res.headers.set('Access-Control-Allow-Origin', corsOrigin)
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  return res
}

export const config = {
  matcher: '/api/:path*',
}
