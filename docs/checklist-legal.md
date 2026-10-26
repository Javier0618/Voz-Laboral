# Checklist legal

> Requiere revisión de abogado colombiano. Este documento enumera temas a verificar; no es asesoría jurídica y no
> afirma el contenido de ninguna norma.

## Protección de datos personales

- [ ] **Ley 1581 de 2012**: pendiente de verificar con un abogado su aplicación a la plataforma (responsable del
      tratamiento, autorización, finalidades, derechos de los titulares y plazos para consultas y reclamos).
- [ ] **Decreto 1074 de 2015**: pendiente de verificar con un abogado las obligaciones reglamentarias aplicables
      (política de tratamiento, aviso de privacidad, registro de bases de datos si corresponde).
- [ ] Redactar la política de tratamiento definitiva (hoy `/politica-de-datos` es un borrador).
- [ ] Definir el canal oficial de consultas y reclamos (hoy hay un correo provisional en `src/config/brand.ts`).
- [ ] Validar los plazos de `docs/retencion.md`.
- [ ] Revisar las transferencias internacionales de datos (región del proyecto de Supabase y del hosting).
- [ ] Validar si los relatos pueden contener datos sensibles y qué autorización requieren.

## Contenido publicado

- [ ] Revisar el riesgo de responsabilidad por relatos sobre empresas (injuria, calumnia, buen nombre) y el papel de
      la moderación previa.
- [ ] Definir el procedimiento de rectificación para empresas (hoy: reclamación de corrección y respuesta pública).
- [ ] Definir el procedimiento ante órdenes judiciales o de autoridades que pidan identificar a un autor.
- [ ] Validar las reglas de publicación (`/reglas`) y los términos (`/terminos`).
- [ ] Validar el uso de la categoría "Posible acoso laboral" y su redacción.

## Guías de derechos

- [ ] Verificar cada ficha de `legal_resources` antes de cambiar su estado a `verificado`.
- [ ] Verificar cada fuente de `legal_resource_sources` y su enlace oficial antes de publicarlo.
- [ ] Mantener la marca "Pendiente de verificación" hasta entonces (la interfaz ya lo hace).

## Marca y operación

- [ ] Verificar la disponibilidad del nombre definitivo y del dominio.
- [ ] Identificar al responsable legal de la plataforma.
