// app/blog/[slug]/page.tsx — Artículo individual
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/db'
import { markdownToHtml } from '@/lib/utils/markdown'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'No encontrado — Breathe' }
  return { title: `${post.title} — Breathe`, description: post.description }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

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
