# Versión 3.0.2.6 — Comprobantes de transferencia

## Cambios

- El inscrito que indique que ya pagó por transferencia debe adjuntar un comprobante.
- Formatos permitidos: PDF, JPG, JPEG y PNG.
- Tamaño máximo: 5 MB.
- Los archivos se guardan en un bucket privado de Supabase Storage.
- El pago queda Pendiente hasta la validación administrativa.
- En Administración > Pagos se puede abrir el comprobante, validarlo o rechazarlo.
- Al validar, el asistente queda con estado de pago Pagado.
- Al rechazar, el pago continúa Pendiente.
- Invitación continúa siendo una condición exclusivamente administrativa.

## Paso obligatorio

Antes de probar la carga de archivos, ejecutar en Supabase SQL Editor:

`VERSION3_0_2_6_EJECUTAR.sql`

No es necesario volver a ejecutar scripts SQL anteriores.
