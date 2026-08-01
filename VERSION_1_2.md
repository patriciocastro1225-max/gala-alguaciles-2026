# Versión 1.2 — Operación

## Correos
- Envío real mediante Resend.
- Envío individual desde la ficha QR.
- Envío por segmentos: todos, confirmados y pendientes.
- Variables automáticas de nombre, mesa personalizada, círculo y código QR.
- Registro de campañas enviadas en Supabase.

## QR y etiquetas
- QR único por asistente.
- Regeneración de QR.
- Etiqueta térmica exacta de 100 × 50 mm.
- QR de aproximadamente 30 × 30 mm.
- Nombre personalizado de la mesa en la etiqueta.

## Check-in
- Lectura mediante cámara cuando BarcodeDetector está disponible.
- Ingreso manual como respaldo.
- Check-in atómico en Supabase.
- Bloqueo real de doble acreditación incluso usando dos dispositivos.
- Registro del usuario que realizó la acreditación.
- Auditoría del ingreso.

## Dashboard
- Actualización automática cada 15 segundos.

## Instalación
1. Ejecutar `VERSION1_2_EJECUTAR.sql` en Supabase.
2. Confirmar `RESEND_API_KEY` y `EMAIL_FROM` en Netlify.
3. Publicar la Versión 1.2.
4. Realizar una prueba con un invitado de prueba antes de usar envío masivo.
