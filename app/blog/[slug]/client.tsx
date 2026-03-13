'use client'
// app/blog/[slug]/client.tsx — Blog post client component
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import type { BlogPost } from '@/types'

function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.split('\n\n').map(p => {
    const trimmed = p.trim()
    if (!trimmed || /^<h[1-3]>/.test(trimmed)) return trimmed
    return `<p>${trimmed}</p>`
  }).join('\n')
  return html
}

export default function BlogPostClient() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(apiUrl(`/api/blog/${slug}`))
      .then(r => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then(data => { if (data) setPost(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (post) document.title = `${post.title} — Breathe`
  }, [post])

  if (loading) {
    return (
      <>
        <div className="stars-bg" aria-hidden="true" />
        <div className="aurora-bg" aria-hidden="true">
          <div className="aurora-blob a1" />
          <div className="aurora-blob a2" />
        </div>
        <main className="relative z-10 min-h-screen px-6 py-16 max-w-2xl mx-auto">
          <p className="text-center text-lavender/50 text-[0.72rem] mt-20">Cargando…</p>
        </main>
      </>
    )
  }

  if (notFound || !post) {
    return (
      <>
        <div className="stars-bg" aria-hidden="true" />
        <div className="aurora-bg" aria-hidden="true">
          <div className="aurora-blob a1" />
          <div className="aurora-blob a2" />
        </div>
        <main className="relative z-10 min-h-screen px-6 py-16 max-w-2xl mx-auto text-center">
          <h1 className="font-serif font-light text-moon text-3xl mb-4">No encontrado</h1>
          <Link href="/blog" className="btn-ghost">Volver al blog</Link>
        </main>
      </>
    )
  }

  const bodyHtml = markdownToHtml(post.body)

  return (
    <>
      <div className="stars-bg" aria-hidden="true" />
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>

      <main className="relative z-10 min-h-screen px-6 py-16 max-w-2xl mx-auto">
        <Link href="/blog" className="back-btn" aria-label="Volver al blog">&#8592;</Link>

        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-64 object-cover rounded-2xl mb-8"
          />
        )}

        <p className="text-[0.52rem] text-lavender/50 tracking-widest uppercase mb-3">
          {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <h1
          className="font-serif font-light text-moon leading-tight mb-8"
          style={{ fontSize: 'clamp(2rem,6vw,3rem)' }}
        >
          {post.title}
        </h1>

        <div
          className="blog-body"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />

        <div className="text-center mt-16 mb-8">
          <Link href="/blog" className="btn-ghost">Volver al blog</Link>
        </div>
      </main>
    </>
  )
}
