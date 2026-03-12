// app/page.tsx — Landing page pública (SEO, server component)
import Link from 'next/link'
import { CONTENT } from '@/lib/constants/content'
import { BREATH_PATTERNS } from '@/lib/constants/patterns'

export default function LandingPage() {
  const { hero, howItWorks, science, patterns, footer } = CONTENT

  return (
    <>
      {/* Fondo */}
      <div className="stars-bg" aria-hidden="true" />
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>

      <main className="relative z-10 min-h-screen">

        {/* ── HERO ── */}
        <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center py-16">
          <span
            className="text-6xl block mb-4"
            style={{ animation: 'moonFloat 5s ease-in-out infinite' }}
            aria-hidden="true"
          >🌙</span>

          <p className="text-[0.6rem] tracking-[0.35em] text-lavender uppercase mb-2">
            {hero.tagline}
          </p>

          <h1
            className="font-serif font-light text-moon leading-none mb-6"
            style={{ fontSize: 'clamp(3rem,9vw,5rem)', letterSpacing: '0.06em' }}
          >
            {hero.title.split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>

          <p className="font-serif italic text-lavender text-lg leading-loose max-w-xs mb-3">
            {hero.subtitle}
          </p>

          <p className="text-[0.7rem] text-lavender/60 max-w-sm leading-relaxed mb-10">
            {hero.description}
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link href="/app" className="btn-primary">
              {hero.cta}
            </Link>
            <Link
              href="/blog"
              className="text-xs tracking-[0.25em] text-lavender/70 hover:text-lavender transition-colors uppercase mt-2"
            >
              Blog
            </Link>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className="px-6 py-20 max-w-2xl mx-auto">
          <h2 className="font-serif font-light text-moon text-3xl text-center mb-12 tracking-wide">
            {howItWorks.title}
          </h2>
          <div className="flex flex-col gap-8">
            {howItWorks.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="text-3xl flex-shrink-0 mt-1">{step.icon}</div>
                <div>
                  <h3 className="font-serif text-moon text-xl mb-2">{step.title}</h3>
                  <p className="text-lavender text-[0.78rem] leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CIENCIA COLOQUIAL ── */}
        <section className="px-6 py-20 max-w-xl mx-auto">
          <div className="glass-card p-8">
            <h2 className="font-serif font-light text-moon text-2xl mb-6 leading-snug">
              {science.title}
            </h2>
            {science.paragraphs.map((p, i) => (
              <p key={i} className="text-star/80 text-[0.8rem] leading-relaxed mb-4">
                {p}
              </p>
            ))}
            <p className="text-lavender text-[0.72rem] tracking-wider mt-6 font-medium">
              {science.conclusion}
            </p>
          </div>
        </section>

        {/* ── LOS 4 PATRONES ── */}
        <section className="px-6 py-20 max-w-lg mx-auto">
          <h2 className="font-serif font-light text-moon text-3xl text-center mb-2 tracking-wide">
            {patterns.title}
          </h2>
          <p className="text-[0.62rem] text-lavender tracking-wider text-center mb-10">
            {patterns.subtitle}
          </p>
          <div className="flex flex-col gap-3">
            {BREATH_PATTERNS.map(pattern => (
              <Link key={pattern.id} href="/app" className="breath-card group">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: pattern.color }}
                >
                  {pattern.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-[0.52rem] text-lavender/50 tracking-widest uppercase mb-0.5">
                    Nivel {pattern.nivel} {pattern.nivel === 1 ? '· más lento' : pattern.nivel === 4 ? '· si sientes falta de aire' : ''}
                  </div>
                  <div className="font-serif text-moon text-xl mb-0.5">{pattern.nombre}</div>
                  <div className="text-[0.58rem] text-lavender leading-relaxed">{pattern.descripcion}</div>
                </div>
                <div className="text-right flex-shrink-0 text-[0.54rem] text-accent tracking-widest">
                  <span className="block font-serif text-moon text-2xl">{Math.round(pattern.rpm)}</span>
                  resp/min
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-[0.55rem] text-lavender/40 tracking-wider">{patterns.hint}</p>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="flex flex-col items-center py-20 px-6 text-center">
          <Link href="/app" className="btn-primary text-base px-12 py-5">
            Empezar esta noche — gratis
          </Link>
          <p className="text-[0.6rem] text-lavender/30 mt-4 tracking-widest">
            Sin cuenta · Sin suscripción · Sin anuncios en la sesión
          </p>
        </section>

        {/* ── FOOTER ── */}
        <footer className="text-center py-10 px-6 border-t border-white/5">
          <p className="text-[0.55rem] text-lavender/30 tracking-[0.3em] uppercase">
            {footer.tagline}
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/blog" className="text-[0.55rem] text-lavender/25 hover:text-lavender/50 transition-colors">
              Blog
            </Link>
            <Link href="/privacidad" className="text-[0.55rem] text-lavender/25 hover:text-lavender/50 transition-colors">
              Política de privacidad
            </Link>
            <Link href="/rgpd" className="text-[0.55rem] text-lavender/25 hover:text-lavender/50 transition-colors">
              RGPD
            </Link>
          </div>
        </footer>

      </main>
    </>
  )
}
