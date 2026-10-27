# Kit de lanzamiento

Textos listos para invitar a las primeras personas y lista de pasos antes de abrir la plataforma. Cambia `[enlace]` por tu dominio.

## Mensajes para WhatsApp

**Para grupos de trabajo o de amigos**

> Hola. Estoy invitando a probar VozLaboral, una página donde los trabajadores cuentan cómo es trabajar en empresas de Colombia: lo bueno, lo malo o las dos cosas. Se publica con un alias o sin cuenta, y tu nombre y tu correo no aparecen. ¿Te animas a contar cómo te fue en tu trabajo actual o en uno anterior? [enlace]

**Corto, para reenviar**

> ¿Cómo te fue en tu último trabajo? Cuéntalo en VozLaboral, sin dar tu nombre. Ayuda a quien está pensando en trabajar ahí: [enlace]

**Para alguien que contó algo en persona**

> Lo que me contaste de tu trabajo le puede servir a otras personas. En VozLaboral puedes contarlo con un alias, sin dar tu nombre, y la moderación revisa que no tenga datos personales antes de publicarlo: [enlace]

## Publicaciones para redes

**Presentación**

> Antes de aceptar un trabajo, ¿no te gustaría saber cómo es por dentro? VozLaboral reúne experiencias de trabajadores en empresas de Colombia, buenas, malas y mixtas, contadas con un alias. Sin puntuaciones ni rankings: relatos reales, revisados antes de publicarse. [enlace]

**Lo bueno también cuenta**

> ¿Tu empresa paga puntual, capacita bien o tiene buenos jefes? Cuéntalo. En VozLaboral también publicamos experiencias buenas: ayudan a quien busca trabajo a saber qué esperar. [enlace]

**Tus derechos**

> ¿Sabes cuándo deben pagarte la prima o cuántos días de vacaciones te corresponden? En VozLaboral hay guías sencillas sobre tus derechos laborales, con su fuente oficial. [enlace]/derechos

## Para quién empezar

1. **Personas cercanas que trabajan o trabajaron en empresas conocidas.** Las primeras 20 a 30 experiencias marcan el tono de la plataforma.
2. **Grupos de trabajadores de un mismo sector o ciudad.** Hay más probabilidad de que varias personas cuenten sobre la misma empresa, y el perfil de empresa empieza a mostrar su balance a partir de 3 experiencias.
3. **Organizaciones de apoyo a trabajadores**, como consultorios jurídicos universitarios, que pueden recomendar las guías.

Evita invitar a escribir sobre una empresa concreta para atacarla: la plataforma pierde credibilidad y aumenta el riesgo legal.

## Antes de abrir al público

- [ ] Migraciones 1400, 1500 y 1600 aplicadas en Supabase.
- [ ] Guías revisadas por un abogado y publicadas desde Moderación → Guías, incluidas las 8 de la parte 3 y los cambios de `guias-derechos-2026-actualizacion.sql`.
- [ ] CAPTCHA en el envío sin cuenta y en el registro (ver `checklist-seguridad.md`).
- [ ] SMTP propio para los correos de Supabase Auth (confirmación y recuperación de contraseña).
- [ ] En Supabase Auth, la *Site URL* y las *Redirect URLs* apuntan al dominio definitivo.
- [ ] Al menos dos personas con rol de moderación, para que nadie modere su propio contenido y la cola no se acumule.
- [ ] Responsable del tratamiento de datos completado en las políticas y en «Quiénes somos».
- [ ] Prueba completa en el dominio definitivo: registro, compartir con y sin cuenta, moderar, reaccionar, comentar y avisos.

## Durante las primeras semanas

- Revisa la cola de moderación al menos una vez al día: una experiencia que tarda días en publicarse desanima a quien la escribió.
- Responde a cada reclamación de empresa dentro de los plazos que fije el abogado.
- Mira qué empresas y temas aparecen más para decidir qué guías escribir después.
