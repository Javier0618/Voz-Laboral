# Video de presentación

Video vertical (1080 × 1920, 57 segundos) para Reels, TikTok, Shorts y estados de WhatsApp. Presenta VozLaboral como un sitio de **guías laborales**: primero las guías, después las calculadoras y al final las experiencias. Termina con un llamado a entrar.

> **Voz:** locución de ElevenLabs v3 con el guion etiquetado de la sección «Voz», sincronizada el 1 de noviembre de 2026 con `voz.cjs --cortes` (ver «Locución actual»).

- `promo.html`: el video, hecho como página animada con la tipografía y los colores de la plataforma. Ábrelo en el navegador para verlo en vivo.
- `render.cjs`: lo graba cuadro por cuadro y arma el MP4 con ffmpeg.
- `capturas/`: capturas reales de la plataforma en tamaño de celular (formulario de compartir y una guía).

## Generar el video

```bash
node video/render.cjs vozlaboral-presentacion.mp4
# Con tu dominio en la pantalla final, en lugar de «Enlace en la descripción»:
node video/render.cjs vozlaboral-presentacion.mp4 --url tuvozlaboral.com
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

La locución se genera en **ElevenLabs v3** con etiquetas de audio (`[pause]`, `[excited]`…) y se une al video con `voz.cjs`, que pone cada bloque en su escena y normaliza el volumen para redes (−14 LUFS).

### Guion para ElevenLabs

Son 9 bloques, uno por escena. Escribe «Voz Laboral» separado para que la voz lo pronuncie bien. Las etiquetas van en inglés porque así las reconoce ElevenLabs, y no se leen en voz alta.

| # | Escena | Máx. | Texto para ElevenLabs |
|---|---|---|---|
| 01 | Gancho | 4,3 s | `[slowly] La ley laboral cambió. [pause] ¿Sabes cómo te afecta?` |
| 02 | Preguntas | 4,7 s | `[playful] ¿Desde qué hora es nocturno? ¿Cuánto vale un domingo? [pause] Está en la ley.` |
| 03 | Marca | 4,4 s | `[excited] Voz Laboral. [pause] Guías laborales claras para trabajadores en Colombia.` |
| 04 | Guías | 9,0 s | `Reforma laboral, reforma pensional, teletrabajo, sindicatos, liquidación… y mucho más. [pause] Tus derechos, con la ley en la mano.` |
| 05 | Cada guía | 6,8 s | `Cada guía te explica qué dice la ley, cómo se aplica y qué puedes hacer.` |
| 06 | Calculadoras | 5,5 s | `[playful] Con las calculadoras revisas tu nómina, tu prima, tus cesantías o tu liquidación.` |
| 07 | Experiencias | 8,6 s | `Y puedes leer lo que cuentan quienes trabajan en cada empresa… [pause] o contar tu experiencia, con un alias.` |
| 08 | Garantías | 4,7 s | `[softly] Cada guía cita su fuente oficial. Y tu nombre nunca se publica.` |
| 09 | Cierre | 5,8 s | `[excited] Conoce tus derechos laborales. [pause] Entra a Voz Laboral.` |

«Máx.» es lo que dura la escena. Si un bloque no cabe, `voz.cjs` lo avisa: acorta el texto o sube la velocidad de la voz.

**Ajustes sugeridos en ElevenLabs:**
- Modelo Eleven v3.
- Voz cálida, masculina o femenina, con acento colombiano o neutro.
- Estabilidad «Natural».
- Velocidad 1,0. Súbela a 1,05–1,1 si algún bloque no cabe.

### Locución actual

La locución de noviembre de 2026 es un solo archivo de 46 s. Sus pausas entre bloques no son más largas que las de dentro de cada bloque, así que se cortó a mano, en silencios comprobados con la transcripción:

```bash
node video/render.cjs video/sin-voz.mp4 --url tuvozlaboral.com
node video/voz.cjs locucion.mp3 video/sin-voz.mp4 video/vozlaboral-presentacion-con-voz.mp4 \
  --cortes 0:4.40,4.78:9.02,9.18:13.49,13.69:22.42,22.61:26.98,27.17:32.02,32.20:37.79,37.97:42.14,42.34:46.10
```

### Unir la voz

Lo más sencillo y preciso es generar **cada bloque por separado** y guardar los clips en una carpeta como `01.mp3` … `09.mp3`:

```bash
node video/render.cjs video/sin-voz.mp4
node video/voz.cjs clips/ video/sin-voz.mp4 video/vozlaboral-presentacion-con-voz.mp4
```

Si prefieres generar todo de una vez, pega los 9 bloques seguidos con `[pause] [pause]` entre uno y otro, y usa el archivo único. El script corta por las 8 pausas más largas:

```bash
node video/voz.cjs locucion.mp3 video/sin-voz.mp4 video/vozlaboral-presentacion-con-voz.mp4
```

En los dos casos el script muestra cuánto dura cada bloque frente al tiempo de su escena. Después genera la versión web con el comando de la sección «En la web».

## Texto para publicar

> La ley laboral cambió. ¿Sabes cómo te afecta? 📘 En VozLaboral encuentras guías claras sobre tus derechos laborales en Colombia —reforma laboral, reforma pensional, teletrabajo, sindicatos, liquidación y más—, cada una con su fuente oficial. También hay calculadoras para revisar tu pago y experiencias de trabajadores contadas con alias. Entra aquí: tuvozlaboral.com
>
> #VozLaboral #TrabajoEnColombia #DerechosLaborales #Empleo

## En la web

La portada (tarjeta «Mira cómo funciona», que abre el video en una ventana) y la página «Quiénes somos» usan una versión liviana que está en `public/video/`:

- `vozlaboral-presentacion.mp4`: 720 × 1280 con voz, alrededor de 1,6 MB. Solo se descarga cuando alguien lo reproduce.
- `vozlaboral-presentacion.jpg`: imagen de portada.
- `vozlaboral-presentacion.es.vtt`: subtítulos con los tiempos reales de la locución.

Para actualizarla después de volver a generar el video con voz:

```bash
ffmpeg -i vozlaboral-presentacion-con-voz.mp4 -vf scale=720:1280 -c:v libx264 -preset slow -crf 27 \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/video/vozlaboral-presentacion.mp4
```

Si cambian los tiempos de la locución, ajusta también los subtítulos.
