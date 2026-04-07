// lib/api-queue.ts — Offline-safe API queue with retry
// Stores failed requests in localStorage and retries them on next visit or connectivity change

const LS_QUEUE = 'breathe_pending_ops'

interface PendingOp {
  url: string
  method: string
  body: string
  createdAt: number
  retries: number
}

const MAX_RETRIES = 5
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getQueue(): PendingOp[] {
  try {
    const raw = localStorage.getItem(LS_QUEUE)
    if (!raw) return []
    const ops: PendingOp[] = JSON.parse(raw)
    // Purge expired entries
    const now = Date.now()
    return ops.filter(op => now - op.createdAt < MAX_AGE_MS && op.retries < MAX_RETRIES)
  } catch {
    return []
  }
}

function saveQueue(queue: PendingOp[]) {
  try {
    localStorage.setItem(LS_QUEUE, JSON.stringify(queue))
  } catch {
    // Storage full — drop oldest entries
    try {
      localStorage.setItem(LS_QUEUE, JSON.stringify(queue.slice(-10)))
    } catch { /* nothing we can do */ }
  }
}

export function enqueue(url: string, method: string, body: string) {
  const queue = getQueue()
  queue.push({ url, method, body, createdAt: Date.now(), retries: 0 })
  saveQueue(queue)
}

export async function flushQueue(): Promise<number> {
  const queue = getQueue()
  if (queue.length === 0) return 0

  const remaining: PendingOp[] = []
  let flushed = 0

  for (const op of queue) {
    try {
      const res = await fetch(op.url, {
        method: op.method,
        headers: { 'Content-Type': 'application/json' },
        body: op.body,
      })
      if (res.ok || res.status === 400 || res.status === 404) {
        // Success or permanent error — don't retry
        flushed++
      } else {
        // Transient error — keep for retry
        remaining.push({ ...op, retries: op.retries + 1 })
      }
    } catch {
      // Network error — keep for retry
      remaining.push({ ...op, retries: op.retries + 1 })
    }
  }

  saveQueue(remaining)
  return flushed
}

/** Resilient fetch: tries the request, queues it on failure */
export async function resilientFetch(
  url: string,
  init: RequestInit & { method: string; body: string },
): Promise<Response | null> {
  try {
    const res = await fetch(url, init)
    if (res.ok) return res
    // Server error (5xx) — queue for retry
    if (res.status >= 500) {
      enqueue(url, init.method, init.body)
    }
    return res
  } catch {
    // Network error — queue for retry
    enqueue(url, init.method, init.body)
    return null
  }
}
