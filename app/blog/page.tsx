'use client'
// app/blog/page.tsx — Listado público de artículos (client-side for static export)
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api'
import type { BlogPost } from '@/types'

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/blog'))
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="stars-bg" aria-hidden="true" />
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>

      <main className="relative z-10 min-h-screen px-6 py-16 max-w-3xl mx-auto">
        <Link href="/" className="back-btn" aria-label="Volver">&#8592;</Link>

        <h1
          className="font-serif font-light text-moon text-center mb-2"
          style={{ fontSize: 'clamp(2.5rem,7vw,4rem)', letterSpacing: '0.06em' }}
        >
          Blog
        </h1>
        <p className="text-center text-lavender text-[0.65rem] tracking-[0.3em] uppercase mb-12">
          Respiración · Sueño · Bienestar
        </p>

        {loading && (
          <p className="text-center text-lavender/50 text-[0.72rem] mt-20">
            Cargando artículos…
          </p>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-center text-lavender/50 text-[0.72rem] mt-20">
            Próximamente publicaremos artículos aquí.
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card block">
              {post.image_url && (
                <img src={post.image_url} alt={post.title} loading="lazy" />
              )}
              <div className="blog-card-body">
                <p className="text-[0.5rem] text-lavender/50 tracking-widest uppercase mb-2">
                  {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h2 className="font-serif text-moon text-xl mb-2 leading-snug">{post.title}</h2>
                <p className="text-[0.72rem] text-star/70 leading-relaxed mb-3">{post.description}</p>
                <span className="text-[0.58rem] text-accent tracking-widest uppercase">
                  Leer más &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/" className="btn-ghost">Volver al inicio</Link>
        </div>
      </main>
    </>
  )
}
