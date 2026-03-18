import { Metadata } from 'next'
import BlogListClient from './client'

export const metadata: Metadata = {
  title: 'Blog — BreatheCalm · Consejos para dormir mejor',
  description: 'Artículos sobre sueño, respiración, meditación y hábitos para combatir el insomnio y descansar mejor cada noche.',
  openGraph: {
    title: 'Blog — BreatheCalm · Consejos para dormir mejor',
    description: 'Artículos sobre sueño, respiración, meditación y hábitos para combatir el insomnio y descansar mejor cada noche.',
    url: 'https://breathecalm.es/blog',
    siteName: 'BreatheCalm',
  },
  alternates: {
    canonical: 'https://breathecalm.es/blog',
  },
}

export default function BlogPage() {
  return <BlogListClient />
}
