// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { SEO_KEYWORDS } from '@/lib/constants/content'

export const metadata: Metadata = {
  title: 'Breathe — Respira como si ya estuvieras dormido',
  description: 'Breathe reproduce la respiración del sueño profundo. Escúchala. Síguela. Tu cuerpo caerá dormido. Gratis, sin pastillas, sin meditación.',
  keywords: SEO_KEYWORDS,
  authors: [{ name: 'Breathe' }],
  openGraph: {
    type:      'website',
    locale:    'es_ES',
    url:       process.env.NEXT_PUBLIC_APP_URL,
    siteName:  'Breathe',
    title:     'Breathe — Respira como si ya estuvieras dormido',
    description: 'La app de insomnio que no te pide nada. Solo escucha la respiración y síguela.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Breathe' }],
  },
  twitter: {
    card:  'summary_large_image',
    title: 'Breathe — Respira y Duerme',
    description: '3 respiraciones por minuto. La frecuencia del sueño delta. Gratis.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width:            'device-width',
  initialScale:     1,
  maximumScale:     1,
  userScalable:     false,
  themeColor:       '#04050c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
