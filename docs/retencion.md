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

## Procedimiento para eliminar una cuenta (automático)

1. La persona titular solicita la eliminación desde «Mi cuenta».
2. Durante 15 días puede cancelarla.
3. Cada día a las 3:17 a. m. (hora de Colombia), `private.run_scheduled_retention()` se ejecuta con `pg_cron`. Por cada cuenta con el plazo vencido:
   - la anonimiza con `process_account_deletion()`;
   - elimina el usuario de Auth, y en cascada su perfil y sus reacciones.

   Las experiencias y los comentarios quedan sin autor, y en los registros de auditoría solo se borra la referencia a la persona.
4. Después ejecuta la purga de registros vencidos (`purge_expired_records()`).
5. Todo queda registrado. Si una cuenta falla, se anota en `security_events` como `eliminacion_programada_fallida` y no frena a las demás.

Migración: `20261102002000_scheduled_retention.sql`. Requiere la extensión `pg_cron` (Supabase → Database → Extensions). Para comprobar la tarea:

```sql
select jobname, schedule, active from cron.job;
select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
```

Para ejecutarla a mano: `select private.run_scheduled_retention();`

## Pendiente

- Validar los plazos con un abogado.
- Definir la conservación de los archivos de respaldo cuando se habiliten.

## Nóminas guardadas (migración 2500)

`payroll_records` guarda lo que una persona con cuenta anota en las calculadoras de nómina. Solo la dueña lo lee (RLS); ni moderación ni administración tienen acceso. Se conserva mientras exista la cuenta: la persona borra cada período desde Mi cuenta, y todo se borra en cascada al eliminar el usuario de Auth (`on delete cascade`). Límite: 500 períodos por cuenta.
