import Link from 'next/link'

export const metadata = {
  title: 'Derechos RGPD — Breathe',
  description: 'Conoce tus derechos segun el Reglamento General de Proteccion de Datos (RGPD).',
}

export default function RgpdPage() {
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
            Tus derechos RGPD
          </h1>

          <div className="blog-body">
            <p><em>Ultima actualizacion: 12 de marzo de 2026</em></p>

            <h2>1. Tus derechos</h2>
            <p>
              El Reglamento General de Proteccion de Datos (RGPD) te garantiza los siguientes
              derechos sobre tus datos personales:
            </p>
            <p>
              <strong>Derecho de acceso:</strong> puedes solicitar una copia de todos los datos
              personales que tenemos sobre ti.
            </p>
            <p>
              <strong>Derecho de rectificacion:</strong> puedes corregir cualquier dato inexacto o
              incompleto.
            </p>
            <p>
              <strong>Derecho de supresion:</strong> puedes solicitar la eliminacion de tus datos
              personales cuando ya no sean necesarios para la finalidad para la que fueron recogidos.
            </p>
            <p>
              <strong>Derecho a la portabilidad:</strong> puedes solicitar tus datos en un formato
              estructurado y de uso comun para transferirlos a otro responsable.
            </p>
            <p>
              <strong>Derecho de oposicion:</strong> puedes oponerte al tratamiento de tus datos en
              determinadas circunstancias.
            </p>
            <p>
              <strong>Derecho a la limitacion:</strong> puedes solicitar que limitemos el tratamiento
              de tus datos mientras se resuelve una reclamacion o verificacion.
            </p>

            <h2>2. Como ejercer tus derechos</h2>
            <p>
              Para ejercer cualquiera de estos derechos, envia un email a{' '}
              <a href="mailto:privacidad@breathecalm.es">privacidad@breathecalm.es</a> con el
              asunto <strong>&quot;Derechos RGPD&quot;</strong>. Incluye tu nombre y el derecho que deseas
              ejercer. Verificaremos tu identidad antes de procesar la solicitud.
            </p>

            <h2>3. Plazo de respuesta</h2>
            <p>
              Responderemos a tu solicitud en un plazo maximo de <strong>30 dias</strong> desde su
              recepcion. Si la solicitud es especialmente compleja, este plazo podra ampliarse otros
              30 dias, en cuyo caso te informaremos.
            </p>

            <h2>4. Derecho a reclamar</h2>
            <p>
              Si consideras que no hemos atendido adecuadamente tus derechos, puedes presentar una
              reclamacion ante la <strong>Agencia Espanola de Proteccion de Datos (AEPD)</strong> en{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
            </p>

            <h2>5. Delegado de proteccion de datos</h2>
            <p>
              Para cualquier consulta relacionada con la proteccion de tus datos, puedes contactar
              con nuestro responsable en{' '}
              <a href="mailto:privacidad@breathecalm.es">privacidad@breathecalm.es</a>.
            </p>

            <h2>6. Transferencias internacionales</h2>
            <p>
              Todos tus datos se almacenan en servidores de <strong>Supabase</strong> ubicados en la
              Union Europea. No realizamos transferencias internacionales de datos fuera del Espacio
              Economico Europeo.
            </p>

            <p>
              Para mas informacion sobre como tratamos tus datos, consulta nuestra{' '}
              <Link href="/privacidad">Politica de Privacidad</Link>.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
