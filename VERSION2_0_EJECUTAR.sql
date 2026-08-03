-- ================================================================
-- VERSIÓN 2.0 — PLANO INTERACTIVO DEL SALÓN
-- Ejecutar en Supabase > SQL Editor.
-- Puede ejecutarse más de una vez.
-- ================================================================

begin;

alter table public.gala_tables
  add column if not exists x_pos numeric(5,2);

alter table public.gala_tables
  add column if not exists y_pos numeric(5,2);

-- Posición inicial automática en una distribución de 5 columnas.
-- Solo se aplica cuando una mesa todavía no tiene coordenadas.
update public.gala_tables
set
  x_pos = 7 + (((table_number - 1) % 5) * 21),
  y_pos = 22 + (floor((table_number - 1) / 5.0) * 15)
where x_pos is null or y_pos is null;

-- Mantener coordenadas dentro del área útil.
update public.gala_tables
set
  x_pos = greatest(2, least(92, x_pos)),
  y_pos = greatest(12, least(88, y_pos));

-- La estructura de la vista cambia; se recrea de forma segura.
drop view if exists public.table_occupancy;

create view public.table_occupancy as
select
  t.id,
  t.table_number,
  t.name,
  t.capacity,
  t.zone,
  t.status,
  t.responsible,
  t.notes,
  t.location,
  t.color,
  t.x_pos,
  t.y_pos,
  count(a.id)::integer as occupied,
  greatest(t.capacity - count(a.id), 0)::integer as available
from public.gala_tables t
left join public.attendees a on a.table_id = t.id
group by
  t.id, t.table_number, t.name, t.capacity, t.zone, t.status,
  t.responsible, t.notes, t.location, t.color, t.x_pos, t.y_pos;

grant select on public.table_occupancy to authenticated;

commit;

select
  table_number,
  name,
  x_pos,
  y_pos
from public.gala_tables
order by table_number;
