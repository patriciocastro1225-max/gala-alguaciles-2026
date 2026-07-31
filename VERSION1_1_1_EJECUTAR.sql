-- ================================================================
-- VERSIÓN 1.1.1 — ESTABILIDAD DE MESAS PERSONALIZABLES
-- Ejecutar en Supabase > SQL Editor > New query > Run.
-- Puede ejecutarse más de una vez sin duplicar datos.
-- ================================================================

begin;

-- 1. Columnas requeridas
alter table public.gala_tables
  add column if not exists status text not null default 'Disponible';

alter table public.gala_tables
  add column if not exists responsible text;

alter table public.gala_tables
  add column if not exists notes text;

alter table public.gala_tables
  add column if not exists location text;

alter table public.gala_tables
  add column if not exists color text default '#C8A14D';

alter table public.gala_tables
  add column if not exists updated_at timestamptz not null default now();

update public.gala_tables
set color = '#C8A14D'
where color is null or btrim(color) = '';

-- 2. Restricciones compatibles
alter table public.gala_tables
  drop constraint if exists gala_tables_zone_check;

alter table public.gala_tables
  add constraint gala_tables_zone_check
  check (zone in ('Protocolar','Autoridades','Central','General','Reserva'));

alter table public.gala_tables
  drop constraint if exists gala_tables_status_check;

alter table public.gala_tables
  add constraint gala_tables_status_check
  check (status in ('Disponible','Reservada','Cerrada'));

-- 3. updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tables_updated_at on public.gala_tables;

create trigger tables_updated_at
before update on public.gala_tables
for each row execute function public.set_updated_at();

-- 4. Recrear vista de ocupación.
-- PostgreSQL no permite cambiar el orden estructural de columnas
-- mediante CREATE OR REPLACE VIEW, por eso se elimina primero.
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
  count(a.id)::integer as occupied,
  greatest(t.capacity - count(a.id), 0)::integer as available
from public.gala_tables t
left join public.attendees a on a.table_id = t.id
group by
  t.id,
  t.table_number,
  t.name,
  t.capacity,
  t.zone,
  t.status,
  t.responsible,
  t.notes,
  t.location,
  t.color;

-- 5. Permiso de lectura de la vista para usuarios autenticados
grant select on public.table_occupancy to authenticated;

commit;

-- 6. Verificación final
select
  count(*) as total_mesas,
  count(*) filter (where location is not null) as mesas_con_ubicacion,
  count(*) filter (where color is not null) as mesas_con_color
from public.gala_tables;

select
  table_number,
  name,
  capacity,
  zone,
  status,
  responsible,
  location,
  color,
  occupied,
  available
from public.table_occupancy
order by table_number;
