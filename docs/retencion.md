# Retención y eliminación de datos

> Requiere revisión de abogado colombiano. Los plazos son una propuesta técnica pendiente de validar frente a la
> Ley 1581 de 2012 y el Decreto 1074 de 2015.

## Qué ocurre al eliminar una cuenta

1. La persona pide la eliminación desde *Mi cuenta* (RPC `request_account_deletion`). Desde ese momento no puede publicar
   y puede cancelar la solicitud.
2. La administración la procesa con `process_account_deletion`, que:
   - marca las experiencias de la cuenta con `anonymized_at`;
   - borra el usuario de `auth.users`. Eso elimina en cascada el perfil (y el alias) y los roles, y pone en `null` el
     autor de experiencias, reportes, reclamaciones, respuestas y apelaciones;
   - registra `account_deleted` en `security_events`.
3. Las experiencias publicadas se conservan sin autor ("Cuenta eliminada").
4. `moderation_events` y `security_events` se conservan. No tienen FK a la cuenta; guardan el UUID como referencia
   de auditoría, no el correo ni el alias.

## Plazos propuestos

| Dato | Plazo propuesto | Motivo |
| --- | --- | --- |
| Procesar una solicitud de eliminación | Hasta 15 días hábiles | Pendiente de verificar el plazo legal aplicable |
| Correo, alias y perfil | Se borran al procesar la solicitud | Minimización |
| Experiencias publicadas | Se conservan anonimizadas | Interés público de la plataforma (pendiente de validar) |
| Experiencias no publicadas de una cuenta eliminada | Se conservan anonimizadas 12 meses y luego se borran | Pendiente de implementar el borrado programado |
| `moderation_events` | 5 años | Auditoría y defensa ante reclamaciones (pendiente de validar) |
| `security_events` | 2 años | Seguridad (pendiente de validar) |
| Reportes, reclamaciones y apelaciones cerrados | 3 años | Trazabilidad (pendiente de validar) |
| Copias de seguridad de Supabase | Según el plan contratado | Revisar el plan antes del lanzamiento |

## Pendiente

- Tarea programada (pg_cron o Edge Function) que aplique los plazos. Hoy no existe borrado automático.
- Procedimiento documentado ante requerimientos de autoridades.
- Verificar si `delete from auth.users` desde una función `security definer` tiene permisos en el proyecto real. Si no,
  mover el paso a una Edge Function con `service_role` (nunca en el navegador).
