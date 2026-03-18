'use client'
// app/blog/[slug]/client.tsx — Blog post client component
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import type { BlogPost } from '@/types'

function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inList = false
  let inBlockquote = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    // Escape HTML
    line = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const trimmed = line.trim()
    if (!trimmed) {
      if (inList) { out.push('</ul>'); inList = false }
      if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false }
      out.push('')
      continue
    }

    // Inline formatting
    line = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

    // Headings
    if (/^\s*### (.+)$/.test(trimmed)) {
      if (inList) { out.push('</ul>'); inList = false }
      if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false }
      out.push(trimmed.replace(/^### (.+)$/, '<h3>$1</h3>'))
      continue
    }
    if (/^\s*## (.+)$/.test(trimmed)) {
      if (inList) { out.push('</ul>'); inList = false }
      if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false }
      out.push(trimmed.replace(/^## (.+)$/, '<h2>$1</h2>'))
      continue
    }
    if (/^\s*# (.+)$/.test(trimmed)) {
      if (inList) { out.push('</ul>'); inList = false }
      if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false }
      out.push(trimmed.replace(/^# (.+)$/, '<h1>$1</h1>'))
      continue
    }

    // List items
    if (/^\s*- (.+)$/.test(trimmed)) {
      if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false }
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${trimmed.replace(/^- /, '')}</li>`)
      continue
    }

    // Blockquote
    if (/^\s*&gt; (.+)$/.test(trimmed)) {
      if (inList) { out.push('</ul>'); inList = false }
      const content = trimmed.replace(/^&gt; /, '')
      if (!inBlockquote) { out.push('<blockquote>'); inBlockquote = true }
      out.push(`<p>${content}</p>`)
      continue
    }

    // Close open blocks before paragraph
    if (inList) { out.push('</ul>'); inList = false }
    if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false }

    // Regular paragraph
    out.push(`<p>${trimmed}</p>`)
  }

  if (inList) out.push('</ul>')
  if (inBlockquote) out.push('</blockquote>')

  return out.join('\n')
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: 'BreatheCalm' },
    publisher: { '@type': 'Organization', name: 'BreatheCalm', url: 'https://breathecalm.es' },
    mainEntityOfPage: `https://breathecalm.es/blog/${slug}`,
    ...(post.image_url ? { image: post.image_url } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
