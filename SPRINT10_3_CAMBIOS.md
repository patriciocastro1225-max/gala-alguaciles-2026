# Sprint 10.3 — Círculos públicos dinámicos

## Cambios principales

- La sección pública **Círculos participantes** dejó de utilizar una lista fija.
- Ahora consulta directamente la tabla `public.circles` de Supabase.
- Cada Círculo nuevo creado en Administración aparece automáticamente en la web.
- Los Círculos confirmados se muestran con una luz dorada animada.
- Los pendientes aparecen atenuados como **Próximamente**.
- Los contadores de Círculos confirmados y ciudades representadas se calculan automáticamente.
- Se incorporaron estados de carga, sin registros y error de conexión.

## Paso obligatorio en una instalación ya existente

Ejecutar en **Supabase > SQL Editor** el archivo:

`SPRINT10_3_EJECUTAR.sql`

Este archivo agrega una política RLS de lectura pública únicamente para la tabla de Círculos.
No concede permisos públicos para asistentes, pagos, mesas ni datos administrativos.

## Uso

1. Ir a **Administración > Círculos**.
2. Crear o editar un Círculo.
3. Completar nombre y ciudad.
4. Activar **Participación confirmada** para encender su luz dorada.
5. Guardar y actualizar la portada pública.
