// app/retiros/page.tsx — Placeholder "Próximamente"
import Link from 'next/link'

export const metadata = {
  title: 'Retiros — Breathe',
  description: 'Retiros de meditación y respiración guiada.',
}

export default function RetirosPage() {
  return (
    <>
      <div className="stars-bg" aria-hidden="true" />
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <span className="text-5xl mb-6" aria-hidden="true">🧘</span>
        <h1
          className="font-serif font-light text-moon mb-4"
          style={{ fontSize: 'clamp(2.5rem,7vw,4rem)', letterSpacing: '0.06em' }}
        >
          Retiros
        </h1>
        <p className="text-lavender text-[0.72rem] tracking-[0.2em] uppercase mb-10">
          Próximamente
        </p>
        <p className="text-star/60 text-[0.78rem] max-w-sm leading-relaxed mb-10">
          Estamos preparando experiencias de respiración y meditación guiada en entornos únicos.
          Vuelve pronto para más información.
        </p>
        <Link href="/" className="btn-ghost">Volver al inicio</Link>
      </main>
    </>
  )
}
