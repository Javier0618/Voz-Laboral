# Video de presentación

Video vertical (1080 × 1920, 57 segundos) para Reels, TikTok, Shorts y estados de WhatsApp. Presenta VozLaboral como un sitio de **guías laborales**: primero las guías, después las calculadoras y al final las experiencias. Termina con un llamado a entrar.

> **Sin voz por ahora.** La versión anterior, centrada en experiencias, tenía la locución de ElevenLabs. Esta versión nueva aún no tiene voz: graba una con el guion de abajo y únela con `voz.cjs` (ajusta sus cortes). La versión anterior sigue disponible en el historial de git.

- `promo.html`: el video, hecho como página animada con la tipografía y los colores de la plataforma. Ábrelo en el navegador para verlo en vivo.
- `render.cjs`: lo graba cuadro por cuadro y arma el MP4 con ffmpeg.
- `capturas/`: capturas reales de la plataforma en tamaño de celular (formulario de compartir y una guía).

## Generar el video

```bash
node video/render.cjs vozlaboral-presentacion.mp4
# Con tu dominio en la pantalla final, en lugar de «Enlace en la descripción»:
node video/render.cjs vozlaboral-presentacion.mp4 --url vozlaboral.co
# Solo algunos cuadros como PNG, para revisar el diseño:
node video/render.cjs prueba.mp4 --frames 120,600,1500
```

Necesita Playwright con Chromium y ffmpeg. Tarda unos 3 minutos.

## Escenas

| Segundos | Escena | Texto principal |
|---|---|---|
| 0–5 | Gancho | La ley laboral cambió. ¿Sabes cómo te afecta? |
| 5–10 | Preguntas | ¿Desde qué hora es trabajo nocturno? ¿Cuánto me pagan un domingo? ¿Cuánto dura un contrato fijo? ¿Me pueden escribir de noche? |
| 10–14 | Marca | VozLaboral: guías laborales claras para trabajadores en Colombia |
| 14–24 | Guías | Tus derechos, con la ley en la mano (temas y captura de una guía) |
| 24–31 | Cada guía | Qué dice la ley · Cómo se aplica · Qué puedes hacer · Fecha de revisión |
| 31–37 | Calculadoras | Revisa tus cuentas: nómina, prima y cesantías, liquidación, salario neto |
| 37–46 | Experiencias | Y lo que cuentan quienes trabajan ahí (tres tarjetas de ejemplo) |
| 46–51 | Garantías | Fuente oficial · Experiencias revisadas · Nombre y correo nunca se publican |
| 51–57 | Llamado a la acción | Conoce tus derechos laborales · Entra a VozLaboral |

Las tarjetas de experiencias son ejemplos ilustrativos y así lo dice el video. Las respuestas a las preguntas de la escena 2 están en las guías (trabajo nocturno desde las 7:00 p. m., recargo dominical, contrato fijo de hasta 4 años, desconexión laboral). Si cambia la ley, revisa esas preguntas.

## Voz

`voz.cjs` une una locución al video: corta el audio por frases y pone cada una en su escena, con el volumen normalizado para redes (−14 LUFS).

```bash
node video/render.cjs sin-voz.mp4
node video/voz.cjs locucion.mp3 sin-voz.mp4 vozlaboral-presentacion-con-voz.mp4
```

Los cortes de `voz.cjs` corresponden a la locución de ElevenLabs con la voz «Diego». Si grabas otra, ajusta los segundos de cada frase.

## Guion de voz

El video funciona sin sonido, como se ve la mayoría de los videos en redes. Este guion sigue las escenas (unas 130 palabras) y coincide con los subtítulos de `public/video/vozlaboral-presentacion.es.vtt`:

> La ley laboral cambió. ¿Sabes cómo te afecta? ¿Desde qué hora es trabajo nocturno? ¿Cuánto te pagan un domingo? La respuesta está en la ley. Te la explicamos.
>
> VozLaboral: guías laborales claras para trabajadores en Colombia. Reforma laboral, reforma pensional, teletrabajo, sindicatos, liquidación y más. Tus derechos, con la ley en la mano.
>
> Cada guía te dice qué dice la ley, cómo se aplica y qué puedes hacer, con su fuente oficial.
>
> Las calculadoras te ayudan a revisar tu nómina, tu prima, tus cesantías o tu liquidación.
>
> Y puedes leer lo que cuentan quienes trabajan en cada empresa, o compartir tu experiencia con un alias.
>
> Cada guía cita su fuente oficial, y tu nombre y tu correo nunca se publican.
>
> Conoce tus derechos laborales. Entra a VozLaboral.

Después de grabarla, ajusta en `voz.cjs` los segundos de cada frase (`desde`, `hasta`) y el segundo del video donde empieza (`en`), según la tabla de escenas.

## Texto para publicar

> La ley laboral cambió. ¿Sabes cómo te afecta? 📘 En VozLaboral encuentras guías claras sobre tus derechos laborales en Colombia —reforma laboral, reforma pensional, teletrabajo, sindicatos, liquidación y más—, cada una con su fuente oficial. También hay calculadoras para revisar tu pago y experiencias de trabajadores contadas con alias. Entra aquí: [enlace]
>
> #VozLaboral #TrabajoEnColombia #DerechosLaborales #Empleo

## En la web

La portada (tarjeta «Mira cómo funciona», que abre el video en una ventana) y la página «Quiénes somos» usan una versión liviana que está en `public/video/`:

- `vozlaboral-presentacion.mp4`: 720 × 1280, alrededor de 1 MB. Solo se descarga cuando alguien lo reproduce.
- `vozlaboral-presentacion.jpg`: imagen de portada.
- `vozlaboral-presentacion.es.vtt`: subtítulos con el texto del guion.

Para actualizarla después de volver a generar el video con voz:

```bash
ffmpeg -i vozlaboral-presentacion-con-voz.mp4 -vf scale=720:1280 -c:v libx264 -preset slow -crf 27 \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/video/vozlaboral-presentacion.mp4
```

Si cambian los tiempos de la locución, ajusta también los subtítulos.
