# ACTIVACIÓN DE SUPABASE — SPRINT 6

## 1. Crear el proyecto

1. Ingresa a Supabase.
2. Crea un proyecto nuevo.
3. Guarda con seguridad la contraseña de la base.
4. Espera hasta que el proyecto esté disponible.

## 2. Crear las tablas

1. En Supabase abre **SQL Editor**.
2. Selecciona **New query**.
3. Copia todo el contenido de `supabase/schema.sql`.
4. Presiona **Run**.

Esto crea:

- Círculos.
- Asistentes.
- Mesas.
- Invitados especiales.
- Pagos.
- Campañas de correo.
- Historial de auditoría.
- 22 mesas iniciales.
- Políticas de seguridad RLS.

## 3. Crear el administrador

1. Abre **Authentication**.
2. Ingresa a **Users**.
3. Presiona **Add user**.
4. Crea el usuario administrador.
5. Usa una contraseña distinta de la demostración.

## 4. Obtener las claves públicas

Abre:

**Project Settings → API**

Copia:

- Project URL.
- anon public key.

Nunca uses la `service_role` en el navegador.

## 5. Configuración local

Crea `.env.local` en la raíz:

```text
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_ANON
```

Después ejecuta:

```bash
npm install
npm run dev
```

## 6. Configuración en Netlify

En el proyecto de Netlify:

1. Site configuration.
2. Environment variables.
3. Add a variable.
4. Agrega las dos variables anteriores.
5. Ejecuta **Trigger deploy**.

## 7. Verificación

Abre:

```text
/admin/configuracion
```

Debe aparecer:

**Supabase está activo**

## Situación de este Sprint

El Sprint 6 deja preparados:

- Cliente Supabase.
- Autenticación real.
- Cierre de sesión seguro.
- Esquema SQL completo.
- RLS.
- Diagnóstico de conexión.
- Modo demostración automático cuando no existen claves.

La migración final de cada módulo desde datos de ejemplo hacia consultas CRUD reales se realizará en el siguiente Sprint.
