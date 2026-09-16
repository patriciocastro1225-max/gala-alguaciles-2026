-- II GRAN GALA NACIONAL 2026
-- CUPOS POR INSCRIPCIÓN: 1 persona, 2 con acompañante o 10 mesa completa
-- Ejecutar una vez en Supabase > SQL Editor.

begin;

alter table public.attendees
  add column if not exists seats_reserved integer not null default 1;

alter table public.attendees
  drop constraint if exists attendees_seats_reserved_check;

alter table public.attendees
  add constraint attendees_seats_reserved_check
  check (seats_reserved in (1, 2, 10));

-- Repara automáticamente todas las inscripciones existentes que ya tienen acompañante.
update public.attendees
set seats_reserved = 2
where nullif(btrim(companion_name), '') is not null
  and seats_reserved < 2;

-- Si ya existe un pago/comprobante por el valor de una mesa completa ($450.000),
-- se reconoce como reserva de 10 cupos. No modifica registros de menor valor.
update public.attendees a
set seats_reserved = 10
where exists (
  select 1
  from public.payments p
  where p.attendee_id = a.id
    and p.amount >= 450000
);

-- La ocupación de cada mesa debe contar CUPOS y no solamente filas/personas principales.
create or replace view public.table_occupancy as
select
  t.*,
  coalesce(sum(case when a.attendance_status <> 'Cancelado' then coalesce(a.seats_reserved, 1) else 0 end), 0)::integer as occupied,
  greatest(
    t.capacity - coalesce(sum(case when a.attendance_status <> 'Cancelado' then coalesce(a.seats_reserved, 1) else 0 end), 0)::integer,
    0
  )::integer as available
from public.gala_tables t
left join public.attendees a on a.table_id = t.id
 group by t.id;

commit;

-- Verificación
select
  full_name,
  companion_name,
  seats_reserved,
  payment_status,
  table_id
from public.attendees
order by seats_reserved desc, full_name;
