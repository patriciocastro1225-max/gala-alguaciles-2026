# Sprint 10.1 — Acceso y recuperación de contraseña

## Credenciales de demostración

Solo cuando Supabase no está configurado:

- Correo: `admin@gala2026.cl`
- Contraseña: `Gala2026!`

## Cuando Supabase está conectado

El usuario debe existir en **Supabase → Authentication → Users**. Por seguridad, la aplicación no crea administradores automáticamente ni guarda una clave maestra.

Se incorporó:

- Enlace «¿Olvidaste tu contraseña?» en el acceso.
- Página `/admin/recuperar-clave` para enviar el correo de recuperación.
- Página `/admin/nueva-clave` para establecer una contraseña nueva.
- Validación de coincidencia y mínimo de 10 caracteres.
- Redirección segura al panel después del cambio.

## Configuración necesaria en Supabase

En **Authentication → URL Configuration** agrega como Redirect URL:

`https://TU-DOMINIO-NETLIFY.netlify.app/admin/nueva-clave`

También puedes agregar el dominio definitivo cuando esté disponible.
