# Versión 2.6.2 — Scroll real del menú lateral

Esta corrección cambia la estructura del menú, no solo el CSS.

## Solución

Se agregó un contenedor independiente `sidebarScrollArea` entre:

- el encabezado Gala Nacional / Panel 2026;
- el botón Cerrar sesión.

Ese contenedor tiene altura flexible y `overflow-y: auto`, por lo que la lista completa
de módulos puede desplazarse verticalmente.

## Resultado esperado

- Encabezado fijo arriba.
- Cerrar sesión fijo abajo.
- Menú central desplazable con rueda, trackpad o arrastre.
- Barra vertical dorada visible cuando el contenido supera la altura disponible.

No requiere SQL ni cambios en Supabase.
