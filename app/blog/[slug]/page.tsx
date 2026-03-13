import BlogPostClient from './client'

export const dynamicParams = true

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Return a placeholder — actual content is fetched client-side
  return [{ slug: '_' }]
}

export default function BlogPostPage() {
  return <BlogPostClient />
}
