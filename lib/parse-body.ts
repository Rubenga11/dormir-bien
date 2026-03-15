// lib/parse-body.ts — UTF-8 safe JSON body parser for Next.js on Alpine/musl
// Workaround: req.json() on Next.js 14 standalone + Alpine may decode non-ASCII
// bytes as Latin-1 instead of UTF-8. Reading raw bytes and decoding explicitly fixes this.

import { NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseJsonBody(req: NextRequest): Promise<any> {
  const buf = await req.arrayBuffer()
  const text = new TextDecoder('utf-8').decode(buf)
  return JSON.parse(text)
}
