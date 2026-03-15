// lib/parse-body.ts — UTF-8 safe JSON body parser for Next.js on Alpine/musl
// Workaround: req.json() on Next.js 14 standalone + Alpine may decode non-ASCII
// bytes as Latin-1 instead of UTF-8. Reading raw bytes and decoding explicitly fixes this.

import { NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseJsonBody(req: NextRequest): Promise<any> {
  const buf = await req.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const text = new TextDecoder('utf-8').decode(bytes)
  // Log hex of first non-ASCII bytes for debugging
  const nonAscii = Array.from(bytes).filter(b => b > 127)
  if (nonAscii.length > 0) {
    console.log('[parseJsonBody] non-ASCII bytes:', nonAscii.map(b => b.toString(16)).join(','))
    console.log('[parseJsonBody] decoded text sample:', text.slice(0, 200))
  }
  return JSON.parse(text)
}
