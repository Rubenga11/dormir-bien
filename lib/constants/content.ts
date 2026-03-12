// lib/constants/content.ts — Textos de la landing, SEO-optimizados

export const CONTENT = {
  hero: {
    tagline:     'respira · duerme · descansa',
    title:       'Respira como si\nya estuvieras dormido.',
    subtitle:    'Tu cuerpo sabrá qué hacer.',
    description: 'Breathe reproduce la respiración del sueño profundo. Escúchala. Síguela. Cae dormido sin pastillas, sin meditación, sin esfuerzo.',
    cta:         'Empezar ahora — gratis',
    adminLink:   'acceso admin',
  },

  howItWorks: {
    title: '¿Por qué funciona?',
    steps: [
      {
        icon:  '🫁',
        title: 'Respiras más lento',
        text:  'Tu cuerpo no puede mantener 3 respiraciones por minuto despierto de forma sostenida. Es físicamente incompatible con la vigilia.',
      },
      {
        icon:  '⚡',
        title: 'Tu nervio vago recibe la señal',
        text:  'La exhalación lenta estimula el nervio vago. Tu frecuencia cardíaca baja. La temperatura corporal desciende.',
      },
      {
        icon:  '😴',
        title: 'Tu cerebro decide dormirse',
        text:  'Cuando la temperatura baja y el ritmo cardíaco cae, el cerebro interpreta que es hora de dormir. Y lo hace.',
      },
    ],
  },

  science: {
    title: '¿Sabías que cuando duermes de verdad respiras solo 3 veces por minuto?',
    paragraphs: [
      'Cuando dormimos en la fase más profunda —la que los científicos llaman sueño delta— respiramos entre 3 y 6 veces por minuto. Es lentísimo. Tan lento que si lo intentas conscientemente mientras estás despierto, tu cerebro entra en conflicto: "esto no tiene sentido, nadie respira así despierto, mejor me duermo".',
      'Es lo que los investigadores del sueño llaman acoplamiento respiratorio-cardíaco. Tu frecuencia cardíaca, tu temperatura corporal y tu ritmo de respiración están sincronizados. Si manipulas uno, arrastras a los demás. Y el más fácil de controlar voluntariamente eres tú: la respiración.',
      'Breathe reproduce exactamente esos patrones. Tú solo tienes que escuchar y seguirlos.',
    ],
    conclusion: 'Sin pastillas. Sin meditación. Sin contar ovejas.',
  },

  patterns: {
    title:    'Cuatro ritmos. Empieza por el más lento.',
    subtitle: 'Si sientes falta de aire, sube un nivel. Tu cuerpo irá adaptándose noche a noche.',
    hint:     'Cuanto más lento, más profundo el sueño que imitas',
  },

  gate: {
    title:       'Prepárate para dormir',
    description: 'Pon el teléfono boca abajo bajo la almohada.\nSolo escucha la respiración y síguela.',
    hint:        '🎧 auriculares recomendados · volumen bajo',
    cta:         'Iniciar respiración',
    back:        '← volver',
  },

  registro: {
    title:    'Una última cosa',
    subtitle: 'Solo para entender mejor a quién ayudamos',
    fields: {
      genero:    'Género',
      edad:      'Edad',
      medicacion:'¿Tomas medicación para dormir?',
      ciudad:    'Ciudad',
      cp:        'Código postal',
      horas:     'Horas de sueño habituales',
      email:     'Email',
      consentimiento: 'Acepto recibir información y novedades por email',
    },
    options: {
      genero:    ['Hombre', 'Mujer', 'Otro'],
      edad:      ['18–24', '25–34', '35–44', '45–54', '55–64', '65+'],
      medicacion:['Sí, habitualmente', 'A veces', 'No'],
      horas:     ['Menos de 5h', '5–6h', '6–7h', '7–8h', 'Más de 8h'],
    },
    cta: 'Empezar →',
  },

  footer: {
    tagline: 'respira · duerme · descansa',
  },
}

// Keywords objetivo para SEO (también usadas en metadata)
export const SEO_KEYWORDS = [
  'técnicas para dormir rápido',
  'respiración para dormir',
  'ejercicios respiración insomnio',
  'insomnio sin pastillas',
  'respiración sueño profundo',
  'app para dormir gratis',
  'método respiración dormir',
  'nervio vago activar',
  'no puedo dormir qué hago',
  'sueño delta respiración',
]
