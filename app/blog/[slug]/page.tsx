import { Metadata } from 'next'
import { getBlogPostBySlug } from '@/lib/db'
import BlogPostClient from './client'

export const dynamicParams = true

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [{ slug: '_' }]
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'No encontrado — BreatheCalm' }

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

export default function BlogPostPage() {
  return <BlogPostClient />
}
