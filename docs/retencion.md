# Conservación y eliminación de datos (propuesta)

> Los plazos son **una propuesta**, pendiente de validación por un abogado colombiano. Están implementados en `supabase/migrations/20261026000800_account_lifecycle_retention.sql`.

| Dato | Plazo | Mecanismo |
|---|---|---|
| Cuenta activa (correo y alias) | Mientras la cuenta exista | Supabase Auth y `profiles` |
| Solicitud de eliminación | 15 días para cancelarla | `request_account_deletion()` y `cancel_account_deletion()` |
| Experiencias publicadas de una cuenta eliminada | Se conservan **anonimizadas** (`author_id = null`, firmadas como «Autor anónimo») | `process_account_deletion()` |
| Experiencias no publicadas de una cuenta eliminada | Se retiran y se desvinculan de la cuenta | `process_account_deletion()` |
| Reportes, apelaciones y sugerencias de una cuenta eliminada | Se desvinculan del autor | `process_account_deletion()` |
| `security_events` | 12 meses | `purge_expired_records()` |
| `moderation_events` | 5 años, para atender reclamaciones y requerimientos legales | `purge_expired_records()` |
| Usuario en `auth.users` | Se borra después de anonimizar | API de administración de Supabase con la clave `service_role`, **solo desde el servidor** |
| Registros técnicos del proveedor (IP y similares) | Los que fije el contrato del proveedor | Fuera de la aplicación; debe documentarse en la política |

## Procedimiento para eliminar una cuenta

1. La persona titular solicita la eliminación desde «Mi cuenta».
2. Durante 15 días puede cancelarla.
3. Pasado ese plazo, una persona administradora, o un proceso programado con `service_role`, ejecuta `select public.process_account_deletion('<uuid>');`.
4. Después se elimina el usuario de Auth: en el panel de Supabase (Authentication → Users) o con `auth.admin.deleteUser` desde un entorno de servidor.
5. Todo queda registrado en `moderation_events`.

## Purga periódica

Programa `select public.purge_expired_records();` una vez al mes, por ejemplo con `pg_cron` en Supabase. La purga es la única vía para borrar registros de auditoría, y ella misma deja registro.

## Pendiente

- Validar los plazos con un abogado.
- Automatizar los pasos 3 y 4 con una función de servidor (Edge Function) que use `service_role`.
- Definir la conservación de los archivos de respaldo cuando se habiliten.
