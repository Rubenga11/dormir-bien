#!/usr/bin/env node
// scripts/seed-blog.mjs — Seed 6 blog articles via admin API
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const idx = l.indexOf('=')
    return [l.slice(0, idx), l.slice(idx + 1)]
  })
)

const API_BASE = process.env.API_BASE || 'https://api.breathecalm.es'
const ADMIN_SECRET = env.ADMIN_SECRET

if (!ADMIN_SECRET) {
  console.error('Missing ADMIN_SECRET in .env.local')
  process.exit(1)
}

const articles = [
  {
    title: 'Las 5 cosas que están arruinando tu sueño',
    description: 'Descubre los 5 errores nocturnos más comunes que arruinan tu sueño y aprende a corregirlos fácilmente para dormir mejor desde esta noche.',
    published: true,
    body: `Vale, seamos honestos. La mayoría de nosotros sabemos perfectamente que no dormimos bien, pero seguimos haciendo lo mismo cada noche esperando que algo cambie. Spoiler: no cambia solo. Pero la buena noticia es que tampoco hace falta un cambio radical en tu vida. Solo tienes que dejar de hacer estas cinco cosas.

## 1. Mirar el móvil en la cama

Sí, ya lo sabías. Pero ¿sabes exactamente por qué es tan malo? La pantalla emite luz azul que le dice a tu cerebro que son las dos del mediodía. Tu cuerpo frena la producción de melatonina (la hormona del sueño) y te quedas con los ojos como platos durante horas. Aunque hayas puesto el modo noche, el problema no es solo la luz: es la estimulación mental. Un meme gracioso, un reel, una notificación. Tu cerebro no puede desconectar si le das cosas interesantes que procesar.

> Lo mínimo que puedes hacer: deja el móvil boca abajo a partir de las 22h. No tiene que ser perfecto, pero pon distancia.

## 2. Cenar tarde y copioso

Tu sistema digestivo no para porque tú decidas acostarte. Cuando te metes en la cama con el estómago lleno, tu cuerpo está trabajando a pleno rendimiento para digerir esa cena. Eso eleva tu temperatura corporal, acelera el metabolismo y hace que el sueño sea superficial y de mala calidad. Te despiertas "dormido" aunque hayas estado ocho horas en la cama.

Lo ideal es cenar al menos dos horas antes de dormir, y optar por algo ligero: proteína y verdura, nada de pasta, pizza o frituras de noche.

> **¿Y si tengo hambre?**
> Un plátano, un poco de queso o un puñado de nueces están bien. Son alimentos que ayudan a producir serotonina y melatonina. Lo que no está bien es la bolsa de patatas fritas completa.

## 3. Temperatura de la habitación inadecuada

Para que tu cuerpo entre en sueño profundo, necesita bajar su temperatura interna. Si tu habitación está demasiado caliente, ese proceso se bloquea. La temperatura ideal para dormir está entre 17 y 20 grados. Parece frío, pero en realidad el cuerpo lo agradece enormemente.

## 4. Horarios irregulares

Tu cuerpo tiene un reloj interno, el ritmo circadiano, que funciona con una precisión brutal. Si un día te acuestas a las once, otro a la una y el fin de semana a las tres, ese reloj se vuelve loco. Es como tener jet lag crónico sin haber salido de casa. Intenta acostarte y levantarte a la misma hora todos los días, incluso los fines de semana. Al menos durante unas semanas, para ver la diferencia.

## 5. El café de media tarde

La cafeína tiene una vida media de entre 5 y 7 horas. Eso significa que si te tomas un café a las 17h, a las 22h todavía tienes la mitad de esa cafeína en sangre. Tu cuerpo está físicamente en modo alerta aunque tú ya estés agotado. Mucha gente dice "el café no me hace nada" y luego tarda cuarenta minutos en dormirse cada noche pensando que es normal.

> El último café del día debería ser antes de las 14h. A partir de ahí, infusiones, agua o café descafeinado si lo necesitas como ritual.

Ninguna de estas cinco cosas es imposible de cambiar. No tienes que hacerlo todo a la vez. Elige una esta semana, solo una, y nota la diferencia. Tu sueño te lo agradecerá.`
  },
  {
    title: 'La técnica de respiración que te deja frito en menos de 10 minutos',
    description: 'Aprende la técnica de respiración 4-7-8 paso a paso para dormirte en minutos. Un método sencillo y científico contra el insomnio.',
    published: true,
    body: `Existe una técnica que el Dr. Andrew Weil popularizó y que hoy usa mucha gente para apagar el cerebro en cuestión de minutos. Se llama el método 4-7-8 y aunque suena a código de acceso, es más sencillo de lo que parece. Y funciona de verdad.

## ¿Por qué funciona?

Cuando estás estresado o con la mente a mil, tu sistema nervioso simpático está activo. Es el modo "lucha o huye". Para calmarlo, tienes que activar su opuesto: el sistema nervioso parasimpático. Y la respiración es el único proceso del cuerpo que puedes controlar conscientemente para hacer ese cambio. Cuando exhalas más largo de lo que inhalas, directamente le dices a tu sistema nervioso que todo está bien. Que puede relajarse.

**El ritmo 4-7-8:** Inhala 4 segundos por la nariz — Aguanta 7 segundos — Exhala 8 segundos por la boca

## Cómo hacerlo

**1. Colócate cómodo**
En la cama, en el sofá, donde quieras. Puedes hacerlo tumbado o sentado. Si estás tumbado, mejor.

**2. Inhala durante 4 segundos**
Por la nariz, tranquilamente. No hace falta hincharte como un globo. Respira con normalidad pero contando mentalmente hasta cuatro.

**3. Aguanta 7 segundos**
Sin forzar. Solo retén el aire. Si al principio te cuesta, no pasa nada. Con la práctica es más fácil.

**4. Exhala durante 8 segundos**
Por la boca, despacio. Ese "ssss" largo o simplemente dejando salir el aire suavemente. Este paso es el más importante: la exhalación larga es lo que activa el freno del sistema nervioso.

**5. Repite 4 veces**
Con cuatro ciclos es suficiente para empezar. Cuando lleves unos días practicando, puedes hacer hasta 8 ciclos.

## Lo que va a pasar

Al principio puede parecer que no pasa nada. Pero en el tercer o cuarto ciclo vas a notar cómo se relajan los hombros, cómo se afloja la mandíbula. Es casi automático. Tu cuerpo no tiene otra opción: fisiológicamente no puede estar en modo alerta con esa pauta de respiración.

> La práctica hace el maestro. Las primeras noches puede que te cueste concentrarte en los tiempos. A la semana, te saldrá solo y notarás el efecto mucho antes.

Úsala también si te despiertas a las 3 de la mañana con la mente activa. Es igual de efectiva para volver a dormirte que para conciliar el sueño por primera vez.`
  },
  {
    title: 'Por qué cenar de cine es lo peor que le puedes hacer a tu noche',
    description: 'Tu cena afecta directamente a cómo duermes. Descubre qué alimentos evitar y qué cenar para conseguir un sueño profundo y reparador.',
    published: true,
    body: `Reconozcámoslo: cenar bien a las 9 de la noche en España con trabajo, niños, el partido o el capítulo de la serie pendiente es complicado. Pero lo que comes esa última hora del día tiene un impacto enorme en cómo duermes, y probablemente mucho más del que crees.

## Tu cuerpo de noche no es el mismo que el de mediodía

Por la tarde-noche, tu metabolismo empieza a prepararse para el descanso. La producción de insulina baja, los procesos digestivos se ralentizan y tu temperatura corporal empieza a descender. Si en ese momento le metes una cena copiosa, estás poniendo el freno de mano con el coche en marcha.

> **Lo que ocurre cuando cenas demasiado tarde y mucho**
> Tu cuerpo eleva la temperatura para digerir. El reflujo ácido sube (especialmente si te tumbas pronto). Tu frecuencia cardíaca se mantiene alta. Y el sueño profundo, ese que de verdad te recupera, llega mucho más tarde o directamente no aparece.

## Los peores alimentos para cenar si quieres dormir

- **Comidas muy grasas:** pizzas, frituras, hamburguesas. Tardan horas en digerirse.
- **Alcohol:** Sí, "te ayuda a dormirte" pero destroza la calidad del sueño. Fragmenta el sueño profundo y te despertarás a mitad de noche o por la mañana cansado igualmente.
- **Azúcar y carbohidratos simples:** Un pico de glucosa a las 10 de la noche y luego la bajada te despertará antes de lo previsto.
- **Picante:** Eleva la temperatura corporal y puede provocar molestias digestivas que te impidan descansar.
- **Proteína en exceso:** El pollo es bueno, pero kilos de proteína requieren mucho trabajo digestivo.

## ¿Y qué sí puedo cenar?

La clave es ligero y rico en triptófano, el aminoácido precursor de la serotonina y la melatonina. No es magia, es química.

- Huevos (revueltos, en tortilla ligera)
- Pavo o pollo a la plancha con verdura
- Pescado blanco
- Yogur natural con una fruta
- Sopa de verduras
- Un plátano, que además tiene magnesio relajante

> La regla de las dos horas. Intenta cenar al menos dos horas antes de irte a la cama. Si cenas a las 9, no te acuestes hasta las 11. Dale tiempo a tu cuerpo.

## ¿Y si trabajo hasta tarde y no puedo cenar antes?

Pasa. En esos días, prioriza algo pequeño y fácil de digerir. Una sopa, un huevo duro con un poco de pan, fruta con yogur. No es la cena ideal pero es mucho mejor que una cena copiosa tarde. Tu sueño notará la diferencia esa misma noche.`
  },
  {
    title: 'Body scan: el truco de los astronautas para dormir en cualquier parte',
    description: 'Aprende la técnica de body scan que usa la NASA para conciliar el sueño rápidamente. Guía paso a paso para relajarte y dormir profundo.',
    published: true,
    body: `La NASA lo usa con sus astronautas. Los militares americanos lo incluyen en su protocolo de recuperación. Y tú puedes hacerlo esta noche en tu cama sin saber absolutamente nada de meditación. Se llama body scan, o exploración corporal, y es probablemente la técnica más accesible y efectiva para conciliar el sueño que existe.

## ¿En qué consiste exactamente?

Es muy sencillo: recorres tu cuerpo mentalmente de arriba a abajo (o de abajo a arriba), prestando atención a cada parte durante unos segundos. Solo observar, sin hacer nada especial. Y lo que pasa es curioso: cuando le prestas atención a una parte del cuerpo, esa zona se relaja. Es casi automático.

La razón es que tu mente no puede estar al mismo tiempo pensando en el informe de mañana Y prestando atención a cómo se siente tu tobillo derecho. El body scan ocupa la mente con algo neutral y presente, cortando el bucle de pensamientos que te mantiene despierto.

> No tienes que "vaciarte la mente". Eso es el mayor mito de la meditación. Solo tienes que redirigir la atención, una y otra vez. Eso es todo.

## Cómo hacerlo paso a paso

**1. Túmbate y cierra los ojos**
En tu posición habitual para dormir. No hace falta que sea "posición de meditación". Pijama, manta, lo de siempre.

**2. Empieza por los pies**
Lleva la atención a los dedos del pie derecho. ¿Los sientes? ¿Están fríos, calientes? ¿Hay tensión? Solo observa unos segundos.

**3. Sube lentamente**
Planta del pie, talón, tobillo, gemelo, rodilla, muslo. Luego el pie izquierdo y lo mismo. Ve despacio, sin prisa.

**4. Continúa hacia el torso**
Caderas, abdomen, pecho. Nota cómo sube y baja tu respiración. Siente el peso de tu cuerpo en el colchón.

**5. Brazos, cuello y cara**
Hombros (típicamente los más tensos), codos, muñecas, manos. Luego cuello, mandíbula (¿la tienes apretada?), ojos, frente. Deja que todo se suelte.

> **¿Me distraigo y pienso en otras cosas?**
> Normal. Le pasa a todo el mundo, incluso a meditadores con años de práctica. Cuando notes que te has ido, simplemente vuelves a donde estabas. Sin juzgarte. Eso es meditar: volver, una y otra vez.

## ¿Cuánto tarda en hacer efecto?

Muchas personas se quedan dormidas antes de llegar a la cabeza. Otras necesitan un par de rondas. Hay noches que funciona a los tres minutos y otras que tardas más. Lo importante es que tu cuerpo está en un estado de relajación profunda desde los primeros minutos, aunque la mente tarde un poco más en seguirle.

Practícalo una semana seguida y notarás que cada noche es más fácil y más rápido. Tu cuerpo aprende el patrón y empieza a asociar el ejercicio con el sueño.`
  },
  {
    title: 'Luz blanca por la noche: el error que cometes cada día sin saberlo',
    description: 'La luz azul de pantallas y LEDs destruye tu melatonina sin que lo sepas. Aprende a gestionar la luz para mejorar tu sueño profundo.',
    published: true,
    body: `Tu cerebro lleva millones de años usando la luz del sol para saber qué hora es. Azul brillante: mediodía, modo activo. Rojo y naranja cálido: atardecer, prepararse para descansar. Oscuridad: dormir. Y entonces llegaron las pantallas y lo rompieron todo.

## El problema con la luz azul

Las pantallas de móviles, ordenadores y televisiones emiten principalmente luz en el espectro azul. Cuando esa luz le llega a tus ojos, la glándula pineal, que es la que produce melatonina (la hormona que te dice "ya es hora de dormir"), frena en seco. Literalmente cree que es de día.

El resultado: aunque sean las 23h, tu cuerpo tiene niveles de melatonina como si fueran las 3 de la tarde. Y te preguntas por qué tardas tanto en dormirte.

> **¿Y el modo noche del móvil?**
> Ayuda algo, pero no soluciona el problema. El modo noche reduce ligeramente la luz azul, pero sigue siendo estimulante a nivel mental. Lo que ves en esas pantallas (redes sociales, noticias, series) activa tu cerebro independientemente del color de la luz.

## Las luces de casa también importan

No es solo el móvil. Los LED blancos de techo emiten exactamente el mismo espectro que el sol del mediodía. Si tienes la habitación con luz blanca intensa a las 22h, tu cuerpo no puede prepararse para dormir aunque tú quieras.

> El cambio más fácil y barato que puedes hacer: sustituye las bombillas de tu dormitorio y el salón por bombillas de luz cálida (2700K o menos). La diferencia en cómo duermes puede sorprenderte.

## Qué hacer en la práctica

- **A partir de las 21h:** Solo luz cálida en casa. Lámparas de pie, velas, lo que sea pero no el LED blanco del techo.
- **A partir de las 22h:** Pantallas al mínimo o a cero. Si necesitas el móvil, ponlo en modo avión y déjalo lejos de la cama.
- **La tele cuenta:** Mirar una serie no es igual de malo que el móvil (estás más lejos y la estimulación es menor), pero apágala al menos 30 minutos antes de dormir.
- **Por la mañana, luz brillante:** Abre las persianas nada más levantarte o sal a tomar el aire. Eso resetea tu reloj circadiano y te ayudará a tener sueño a una hora razonable esa noche.

## El círculo virtuoso

Cuando gestionas bien la luz, tu cuerpo produce melatonina a su hora. Tienes sueño cuando toca, te duermes antes, duermes mejor y te despiertas más descansado. Que entonces tienes más energía durante el día y no necesitas el café de las 5 de la tarde que te quita el sueño. Todo encaja.

Es uno de esos cambios que parece pequeño pero que tiene un impacto enorme en cómo te encuentras cada día.`
  },
  {
    title: 'Respirar como tu pareja: el secreto que os une mientras dormís',
    description: 'Descubre cómo sincronizar tu respiración con la de tu pareja para dormiros juntos y fortalecer vuestra conexión emocional cada noche.',
    published: true,
    body: `Has llegado a casa tarde, los dos estáis agotados, apenas habéis hablado. Lleváis unos días de esos en los que el trabajo, el estrés y el día a día os han puesto en modo automático. Pero luego os metéis en la cama, y aunque no lo sepáis, algo silencioso y extraordinario empieza a ocurrir entre los dos.

## Lo que pasa cuando dormís juntos

Los científicos llevan décadas estudiando qué ocurre cuando dos personas comparten cama. Y lo que han encontrado es bonito: las parejas tienden a sincronizar su respiración de forma inconsciente mientras duermen. No es que lo decidan. Es que el cuerpo, cuando se siente seguro y en compañía de alguien de confianza, lo hace solo.

Un estudio de la Universidad de Colorado observó que la sincronización cardíaca y respiratoria entre parejas era significativamente mayor cuando dormían juntas que cuando dormían separadas. Y más interesante aún: cuanto más satisfecha estaba la mujer con la relación, mayor era esa sincronización.

> La sincronización no es solo física. Cuando dos personas respiran al mismo ritmo, sus sistemas nerviosos se regulan mutuamente. Es coregulación emocional en estado puro, y ocurre mientras dormís.

## La técnica: respirar a su ritmo para caer rendido

Aquí viene algo que puedes hacer esta misma noche, de forma consciente, para aprovechar todo esto. Es sencillo, no requiere nada especial y tiene dos efectos al mismo tiempo: te ayuda a dormirte más fácilmente y os conecta profundamente aunque no hayáis dicho una palabra.

**1. Espera a que tu pareja empiece a dormirse**
No tienes que hacer nada todavía. Solo observa. Nota cuándo su respiración se hace más profunda y regular. Es una de las señales más bonitas de que alguien se está dejando ir al sueño.

**2. Escucha su ritmo sin analizarlo**
No cuentes segundos ni intentes ser preciso. Solo escucha o nota el movimiento de su cuerpo. El pecho que sube y baja. El sonido suave de su respiración. Estás prestando atención a la persona que más quieres mientras duerme. Es un momento privilegiado.

**3. Empieza a acompasarte, sin forzar**
Inhala cuando notes que ella o él inhala. Exhala cuando exhala. No lo hagas de golpe ni con exactitud milimétrica. Ve acercándote poco a poco, como si fuera un baile lento. Tu respiración se irá ajustando a la suya de forma natural.

**4. Déjate llevar**
A partir de aquí, algo curioso pasa: ya no tienes que pensar en ello. Tu cuerpo sigue el ritmo solo. Y ese ritmo, que es el de alguien que ya está dormido y profundamente relajado, arrastra al tuyo hacia el mismo estado.

> **¿Por qué funciona tan bien?**
> La respiración de alguien dormido es profunda y lenta. Cuando la imitas, tu sistema nervioso recibe exactamente la misma señal que con el método 4-7-8: "todo está bien, puedes relajarte". Además, el hecho de que sea la respiración de tu pareja añade un nivel de conexión emocional que ninguna app puede replicar.

## Más que una técnica para dormir: una forma de conectar

Vivimos con el piloto automático puesto. Muchas noches compartimos cama sin realmente estar juntos. Esta práctica, aunque solo dure unos minutos antes de dormirse, es una forma de decirle a tu cuerpo (y al suyo, aunque no lo sepa) que estáis ahí el uno para el otro.

No necesita palabras. No necesita que seáis el modelo de pareja perfecta ni que hayáis tenido el mejor día del mundo. Solo necesita que pongas atención, durante unos minutos, en el ser humano que respira a tu lado.

> Las parejas que sincronizaban su respiración mientras dormían reportaban sentirse más conectadas emocionalmente al día siguiente, incluso sin haber tenido una conversación significativa la noche anterior.

## ¿Y si soy yo quien se duerme antes?

Pues tu pareja puede hacer lo mismo contigo. Puedes contárselo antes de acostaros. Muchas parejas lo convierten en un ritual silencioso, algo que no requiere ni mirarse, pero que les une en ese espacio íntimo y tranquilo que es la cama antes de dormirse.

Algunos lo describen como "sentir que sois uno" en esos momentos. Suena a exageración, pero la ciencia dice que no lo es tanto: vuestros sistemas nerviosos están, literalmente, bailando al mismo compás.

## Para las noches difíciles

Cuando hayáis tenido un mal día, cuando os hayáis discutido, cuando la vida esté siendo complicada... esas son las noches en que más vale la pena intentarlo. No como solución mágica, pero sí como un recordatorio de que, pase lo que pase, hay alguien a tu lado. Que su cuerpo confía en el tuyo lo suficiente como para dormirse a su lado. Y que el tuyo puede hacer lo mismo.

A veces el amor no necesita palabras. A veces solo necesita respirar.`
  }
]

async function seed() {
  console.log(`Seeding ${articles.length} blog articles to ${API_BASE}...\n`)

  for (const article of articles) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET}`,
        },
        body: JSON.stringify(article),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`FAIL "${article.title}": ${res.status} ${err}`)
        continue
      }

      const data = await res.json()
      console.log(`OK "${data.title}" → /blog/${data.slug}`)
    } catch (err) {
      console.error(`ERROR "${article.title}":`, err.message)
    }
  }

  console.log('\nDone!')
}

seed()
