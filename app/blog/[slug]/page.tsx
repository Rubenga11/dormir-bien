import { Metadata } from 'next'
import BlogPostClient from './client'

export const dynamicParams = true

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Fetch published slugs from API so each blog post gets a static page
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    const res = await fetch(`${apiBase}/api/blog`, { next: { revalidate: 0 } })
    if (res.ok) {
      const posts: { slug: string }[] = await res.json()
      const slugs = posts.map(p => ({ slug: p.slug }))
      // Keep '_' as fallback for slugs added after build
      if (!slugs.find(s => s.slug === '_')) slugs.push({ slug: '_' })
      return slugs
    }
  } catch {
    // API not available during build — use placeholder
  }
  return [{ slug: '_' }]
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params

  // During static export (frontend build), Supabase is not available.
  // Try fetching metadata; fall back to generic SEO tags.
  try {
    const { getBlogPostBySlug } = await import('@/lib/db')
    const post = await getBlogPostBySlug(slug)
    if (post) {
      return {
        title: `${post.title} — BreatheCalm`,
        description: post.description,
        openGraph: {
          title: post.title,
          description: post.description,
          url: `https://breathecalm.es/blog/${slug}`,
          type: 'article',
          siteName: 'BreatheCalm',
          ...(post.image_url ? { images: [{ url: post.image_url }] } : {}),
        },
        twitter: {
          card: 'summary_large_image',
          title: post.title,
          description: post.description,
        },
        alternates: {
          canonical: `https://breathecalm.es/blog/${slug}`,
        },
      }
    }
  } catch {
    // Supabase unavailable (static export build) — use fallback
  }

  return {
    title: 'Blog — BreatheCalm',
    description: 'Artículos sobre sueño, respiración y bienestar para dormir mejor cada noche.',
    openGraph: {
      title: 'Blog — BreatheCalm',
      description: 'Artículos sobre sueño, respiración y bienestar para dormir mejor cada noche.',
      url: 'https://breathecalm.es/blog',
      siteName: 'BreatheCalm',
    },
  }
}

export default function BlogPostPage() {
  return <BlogPostClient />
}
