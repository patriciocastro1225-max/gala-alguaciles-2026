# Sprint 10.4 — Invitaciones, QR y acreditación

## Incluido
- QR real y único por asistente usando `qrcode.react`.
- Regeneración del token QR desde el panel.
- Etiqueta profesional de **100 × 50 mm** con QR de 30 × 30 mm.
- Impresión en tamaño real mediante CSS `@page`.
- Check-in por cámara usando `BarcodeDetector` cuando el navegador lo permite.
- Ingreso manual como alternativa universal.
- Prevención de doble acreditación.
- Envío real de correos mediante Resend.
- Plantillas con [Nombre], [Mesa], [Círculo] y [QR].

## Configuración de correo en Netlify
Agregar estas variables de entorno:
- `RESEND_API_KEY`
- `EMAIL_FROM` (por ejemplo: `Gala Alguaciles <invitaciones@tudominio.cl>`)

El dominio remitente debe estar validado dentro de Resend.

## Instalación
1. Ejecutar `SPRINT10_4_EJECUTAR.sql` en Supabase SQL Editor.
2. Subir el proyecto a Netlify.
3. Configurar las variables de correo.
4. Hacer una prueba con un asistente que tenga email.

## Cámara
La lectura directa funciona mejor en Chrome para Android y navegadores compatibles con BarcodeDetector. En iPhone o navegadores no compatibles se mantiene disponible el ingreso manual del código.
