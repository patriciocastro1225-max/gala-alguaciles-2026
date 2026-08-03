# Versión 2.0 — Plano interactivo del salón

La Versión 2.0 incorpora un plano visual y persistente para las 23 mesas.

## Plano

- Nueva opción **Plano del salón** en el menú de administración.
- Las 23 mesas se muestran sobre el salón.
- Cada mesa utiliza su nombre personalizado.
- Arrastrar y soltar para cambiar la ubicación de la mesa.
- Botón **Guardar plano** para almacenar la distribución en Supabase.
- El plano conserva las posiciones después de cerrar sesión o actualizar.

## Estado visual

Cada mesa muestra:

- número;
- nombre;
- asistentes asignados;
- capacidad;
- acreditados.

El fondo cambia según ocupación:

- disponible;
- 70 % o más;
- completa.

## Movimiento de asistentes

En computador:

- arrastre un asistente desde el panel lateral;
- suéltelo sobre otra mesa.

En teléfono o tablet:

- utilice el selector de mesa disponible en cada asistente.

La asignación se guarda inmediatamente en Supabase.

## Seguridad de datos

El plano no crea mesas nuevas ni cambia identificadores. Solo agrega coordenadas
`x_pos` y `y_pos` a las 23 mesas existentes.

## Instalación

1. Ejecutar `VERSION2_0_EJECUTAR.sql` en Supabase.
2. Confirmar que devuelve las 23 mesas con `x_pos` y `y_pos`.
3. Publicar el ZIP en Netlify.
4. Abrir `/admin/plano`.
5. Mover una mesa y guardar.
6. Actualizar la página y verificar que mantenga la posición.
