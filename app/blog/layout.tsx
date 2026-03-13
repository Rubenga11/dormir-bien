// app/blog/layout.tsx — Metadata for blog section (moved from page.tsx for static export compat)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Breathe',
  description: 'Artículos sobre respiración, sueño y bienestar.',
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
