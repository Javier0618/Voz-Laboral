# Video de presentación

Video vertical (1080 × 1920, 57 segundos) para Reels, TikTok, Shorts y estados de WhatsApp. Explica qué es VozLaboral, cómo funciona y qué se puede hacer, y termina con un llamado a entrar.

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
| 0–5 | Gancho | Antes de aceptar un trabajo, ¿no te gustaría saber cómo es por dentro? |
| 5–10 | Problema | ¿Pagan a tiempo? ¿Respetan los turnos? ¿Pagan las horas extra? ¿Cómo tratan a la gente? |
| 10–14 | Marca | VozLaboral: experiencias de trabajadores en empresas de Colombia |
| 14–21 | Tono | Lo bueno, lo malo y lo mixto (tres tarjetas de ejemplo) |
| 21–31 | Cómo funciona | Busca la empresa (si no aparece, pide que la agreguen) · Cuenta cómo te fue · La moderación la revisa |
| 31–38 | Comunidad | Reacciona, comenta y responde · Avisos con una cuenta |
| 38–46 | Derechos | 24 guías claras con su fuente oficial |
| 46–51 | Garantías | Nombre y correo nunca se publican · Revisión previa · Sin rankings |
| 51–57 | Llamado a la acción | Tu experiencia puede ayudar a otra persona · Entra a VozLaboral |

Las tarjetas de experiencias son ejemplos ilustrativos y así lo dice el video. Si cambia el número de guías publicadas, actualiza la escena 7 de `promo.html`.

## Voz

`voz.cjs` une una locución al video: corta el audio por frases y pone cada una en su escena, con el volumen normalizado para redes (−14 LUFS).

```bash
node video/render.cjs sin-voz.mp4
node video/voz.cjs locucion.mp3 sin-voz.mp4 vozlaboral-presentacion-con-voz.mp4
```

Los cortes de `voz.cjs` corresponden a la locución de ElevenLabs con la voz «Diego». Si grabas otra, ajusta los segundos de cada frase.

## Guion de voz

El video funciona sin sonido, como se ve la mayoría de los videos en redes. Si quieres grabar una voz, este guion sigue las escenas (unas 140 palabras):

> ¿Antes de aceptar un trabajo, no te gustaría saber cómo es por dentro? Si pagan a tiempo, si respetan los turnos, cómo tratan a la gente. Eso lo saben quienes trabajan ahí.
>
> VozLaboral reúne experiencias de trabajadores en empresas de Colombia. Lo bueno, lo malo y lo mixto.
>
> Buscas la empresa, y si no aparece, pides que la agreguen. Cuentas cómo te fue con un alias, o sin crear cuenta, y la moderación la revisa antes de publicarla. Tu nombre y tu correo nunca aparecen.
>
> Los demás pueden reaccionar, comentar y responder. Y si tienes cuenta, te avisamos.
>
> Además, hay guías claras sobre tus derechos: liquidación, prima, vacaciones, despido, y más, con su fuente oficial.
>
> Tu experiencia puede ayudar a otra persona. Entra a VozLaboral.

## Texto para publicar

> ¿Cómo es trabajar ahí, contado por quienes trabajan ahí? 👷‍♀️👨‍🍳 En VozLaboral puedes leer y contar experiencias buenas, malas y mixtas en empresas de Colombia, con un alias o sin crear cuenta. También hay guías de tus derechos laborales con su fuente oficial. Entra aquí: [enlace]
>
> #VozLaboral #TrabajoEnColombia #DerechosLaborales #Empleo

## En la web

La portada (tarjeta «Mira cómo funciona», que abre el video en una ventana) y la página «Cómo funciona» usan una versión liviana que está en `public/video/`:

- `vozlaboral-presentacion.mp4`: 720 × 1280, unos 1,8 MB. Solo se descarga cuando alguien lo reproduce.
- `vozlaboral-presentacion.jpg`: imagen de portada.
- `vozlaboral-presentacion.es.vtt`: subtítulos con el texto de la locución.

Para actualizarla después de volver a generar el video con voz:

```bash
ffmpeg -i vozlaboral-presentacion-con-voz.mp4 -vf scale=720:1280 -c:v libx264 -preset slow -crf 27 \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/video/vozlaboral-presentacion.mp4
```

Si cambian los tiempos de la locución, ajusta también los subtítulos.
