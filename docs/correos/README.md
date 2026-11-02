# Plantillas de correo (Supabase Auth)

Se pegan en Supabase → Authentication → Emails → **Templates**. En cada plantilla, cambia el **Subject** y reemplaza todo el **Message body** por el contenido del archivo.

| Plantilla en Supabase | Asunto | Archivo |
|---|---|---|
| Confirm sign up | Confirma tu correo en TuVozLaboral | `confirmar-cuenta.html` |
| Reset password | Cambia tu contraseña de TuVozLaboral | `recuperar-contrasena.html` |
| Change email address | Confirma tu nuevo correo en TuVozLaboral | `cambiar-correo.html` |

Los correos salen por Brevo (SMTP), con el remitente `TuVozLaboral <noreply@tuvozlaboral.com>`. Los estilos van en línea porque muchos programas de correo ignoran las hojas de estilo.

Si un correo falla, la causa está en Supabase → Logs → **Auth**, en el campo `error`. `535 Authentication failed` significa que la clave SMTP de Brevo es incorrecta o está incompleta.
