import { Metadata } from 'next'
import BlogPostClient from './client'

export const dynamicParams = true

export async function generateStaticParams(): Promise<{ slug: string }[]> {
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
