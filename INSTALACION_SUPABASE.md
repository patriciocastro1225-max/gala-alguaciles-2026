# Instalación de Supabase — Sprint 10.2

## Paso 1: ejecutar la base de datos

1. Abre tu proyecto en Supabase.
2. En el menú izquierdo, entra a **SQL Editor**.
3. Pulsa **New query**.
4. Abre el archivo `database.sql` de este paquete.
5. Copia todo su contenido y pégalo en Supabase.
6. Pulsa **Run**.

Al finalizar, la última consulta debe mostrar:

```text
 total_mesas
 23
```

## Paso 2: comprobar las tablas

En **Table Editor** deben aparecer, entre otras:

- `event_config`
- `profiles`
- `circles`
- `gala_tables`
- `attendees`
- `payments`
- `email_campaigns`
- `audit_log`

## Paso 3: usuario administrador

El script crea el perfil del usuario que ya existe en **Authentication > Users** y convierte al primer usuario creado en administrador.

Para esta instalación, el usuario es:

```text
apce@leostore.cl
```

La contraseña no puede verse en Supabase. Debes usar la que definiste al crear el usuario o restablecerla.

## Paso 4: comprobar las 23 mesas

En **Table Editor > gala_tables** deben aparecer las mesas del 1 al 23, desde **Mesa Presidencial** hasta **Mesa de Reserva**.

## Paso 5: probar la aplicación

1. Inicia sesión en el sitio de Netlify.
2. Abre **Dashboard**.
3. El indicador Mesas debe mostrar `23`.
4. Abre **Mesas** para ver el plano conectado a Supabase.

## Si aparece un error

- Confirma que ejecutaste `database.sql` completo.
- Revisa que Netlify tenga las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del mismo proyecto.
- Cierra sesión y vuelve a ingresar después de ejecutar el SQL.
