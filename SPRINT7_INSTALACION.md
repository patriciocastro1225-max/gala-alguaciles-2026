# Sprint 7 — Activación de datos reales

## Paso 1: ejecutar migraciones en Supabase

En **SQL Editor → New query**, ejecute estos archivos uno por uno y en este orden:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_security.sql`
3. `supabase/migrations/003_indexes_views.sql`
4. `supabase/migrations/004_seed.sql`

Cada consulta debe terminar con el mensaje **Success. No rows returned** o un resultado equivalente.

## Paso 2: crear el usuario administrador

En Supabase:

1. Authentication.
2. Users.
3. Add user.
4. Ingrese el correo y una contraseña segura.
5. Active **Auto Confirm User**.

El correo debe ser el mismo que utilizará para ingresar al panel.

## Paso 3: publicar Sprint 7

1. Reemplace el contenido del repositorio GitHub por este Sprint.
2. Confirme el cambio.
3. Netlify iniciará el despliegue.
4. Cuando termine, abra `/admin`.

## Paso 4: comprobación

- Cree un Círculo.
- Cree un asistente.
- Registre un pago.
- Revise el Dashboard.
- Pruebe el check-in con el código QR mostrado en Asistentes.

Los cambios deben permanecer después de cerrar y volver a abrir el navegador.

## Importante

No coloque nunca la clave `service_role` o una `secret key` en variables que comiencen con `NEXT_PUBLIC_`.
El navegador debe usar únicamente la Publishable key o la anon pública.
