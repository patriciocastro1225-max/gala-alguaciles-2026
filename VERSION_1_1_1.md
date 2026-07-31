# Versión 1.1.1 — Estabilidad

## Correcciones

- Se corrige el error `42P16` de la vista `table_occupancy`.
- La vista ahora se elimina y recrea de manera segura.
- La migración puede ejecutarse más de una vez.
- Se asegura la existencia de `location`, `color`, `responsible`, `notes`, `status` y `updated_at`.
- Se restauran las restricciones válidas de zona y estado.
- Se agrega permiso de lectura de la vista para usuarios autenticados.
- Se mantienen las 23 mesas y sus datos existentes.
- No se eliminan asistentes, asignaciones, pagos ni círculos.

## Instalación

1. Abra Supabase.
2. Entre a SQL Editor.
3. Abra una consulta nueva.
4. Pegue todo el contenido de `VERSION1_1_1_EJECUTAR.sql`.
5. Presione Run.
6. Confirme que el resultado muestre `total_mesas = 23`.
7. Publique esta versión en Netlify.
