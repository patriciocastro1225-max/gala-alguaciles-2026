# Versión 2.6 — Comunicaciones avanzadas

## Segmentación

Permite seleccionar destinatarios por:

- Círculo;
- mesa;
- estado de confirmación;
- estado de pago;
- disponibilidad de correo;
- búsqueda libre.

## Plantillas

Incluye plantillas para:

- invitación oficial;
- recordatorio;
- confirmación de mesa;
- confirmación de asistencia.

Variables automáticas:

- `[Nombre]`
- `[Mesa]`
- `[Círculo]`
- `[QR]`

## Historial

Se incorpora:

- historial de campañas;
- cantidad enviada;
- errores;
- registro individual por destinatario;
- ID entregado por Resend;
- fecha y hora del envío.

## Requisitos

- `RESEND_API_KEY` configurada en Netlify.
- `EMAIL_FROM` configurada en Netlify.
- Ejecutar `VERSION2_6_EJECUTAR.sql` antes de publicar.
