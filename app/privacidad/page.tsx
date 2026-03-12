import Link from 'next/link'

export const metadata = {
  title: 'Politica de Privacidad — Breathe',
  description: 'Politica de privacidad de Breathe. Conoce como tratamos tus datos personales.',
}

export default function PrivacidadPage() {
  return (
    <>
      <div className="stars-bg" aria-hidden="true" />
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>

      <main className="relative z-10 min-h-screen px-6 py-20 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <Link href="/" className="btn-ghost inline-flex items-center gap-1 mb-10 text-xs">
            ← Volver
          </Link>

          <h1
            className="font-serif font-light text-moon mb-10"
            style={{ fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '0.06em' }}
          >
            Politica de Privacidad
          </h1>

          <div className="blog-body">
            <p><em>Ultima actualizacion: 12 de marzo de 2026</em></p>

            <h2>1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de tus datos es <strong>Breathe</strong> (breathecalm.es).
              Puedes contactarnos en cualquier momento a traves de{' '}
              <a href="mailto:privacidad@breathecalm.es">privacidad@breathecalm.es</a>.
            </p>

            <h2>2. Datos que recogemos</h2>
            <p>Recogemos las siguientes categorias de datos:</p>
            <p>
              <strong>Datos de registro:</strong> genero, edad, medicacion relacionada con el sueno,
              ciudad, codigo postal, email y horas habituales de sueno.
            </p>
            <p>
              <strong>Datos tecnicos:</strong> direccion IP anonimizada (hash), user agent del
              navegador y pais de origen.
            </p>
            <p>
              <strong>Datos de uso:</strong> sesiones de respiracion guiada completadas y su duracion.
            </p>

            <h2>3. Finalidad del tratamiento</h2>
            <p>Utilizamos tus datos para:</p>
            <p>
              — Mejorar tu experiencia personalizada en la aplicacion.<br />
              — Generar estadisticas agregadas y anonimas sobre patrones de sueno y uso.<br />
              — Enviarte novedades y contenido relacionado, unicamente si has dado tu consentimiento expreso.
            </p>

            <h2>4. Base legal</h2>
            <p>
              El tratamiento de tus datos se basa en tu <strong>consentimiento</strong> (articulo
              6.1.a del Reglamento General de Proteccion de Datos). Puedes retirar tu consentimiento
              en cualquier momento escribiendonos a{' '}
              <a href="mailto:privacidad@breathecalm.es">privacidad@breathecalm.es</a>.
            </p>

            <h2>5. Almacenamiento y conservacion</h2>
            <p>
              Tus datos se almacenan en <strong>Supabase</strong>, con servidores ubicados en la
              Union Europea. Los conservaremos mientras tu cuenta este activa. Si solicitas la
              supresion de tus datos, los eliminaremos en un plazo maximo de 30 dias.
            </p>

            <h2>6. Cookies</h2>
            <p>
              Breathe utiliza unicamente una cookie tecnica (<strong>breathe-admin-token</strong>)
              necesaria para la autenticacion del panel de administracion. No utilizamos cookies de
              rastreo, publicidad ni analitica de terceros.
            </p>

            <h2>7. Cesion a terceros</h2>
            <p>
              No cedemos, vendemos ni compartimos tus datos personales con terceros. Los datos se
              utilizan exclusivamente para los fines descritos en esta politica.
            </p>

            <h2>8. Tus derechos</h2>
            <p>
              Tienes derecho a acceder, rectificar, suprimir, portar, oponerte y limitar el
              tratamiento de tus datos. Consulta todos los detalles en nuestra{' '}
              <Link href="/rgpd">pagina de derechos RGPD</Link>.
            </p>

            <h2>9. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con tu privacidad, escribenos a{' '}
              <a href="mailto:privacidad@breathecalm.es">privacidad@breathecalm.es</a>.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
