-- ================================================================
-- VERSION 3.0.2.9 — CORRECCION COMPATIBILIDAD ATTENDEE_TIMELINE
-- Ejecutar en Supabase > SQL Editor > New query > Run
--
-- Corrige el error:
-- COLUMN "event_type" OF RELATION "attendee_timeline" DOES NOT EXIST
--
-- No elimina datos. Agrega las columnas que necesita el flujo actual
-- de inscripción/pagos si la tabla proviene de una versión anterior.
-- ================================================================

begin;

create table if not exists public.attendee_timeline (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  event_type text,
  title text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.attendee_timeline add column if not exists event_type text;
alter table public.attendee_timeline add column if not exists title text;
alter table public.attendee_timeline add column if not exists description text;
alter table public.attendee_timeline add column if not exists created_at timestamptz not null default now();

create index if not exists attendee_timeline_attendee_idx
  on public.attendee_timeline(attendee_id);

alter table public.attendee_timeline enable row level security;

drop policy if exists "authenticated attendee timeline" on public.attendee_timeline;
create policy "authenticated attendee timeline"
on public.attendee_timeline
for all
to authenticated
using (true)
with check (true);

commit;

-- VERIFICACION: deben aparecer event_type, title, description y created_at.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'attendee_timeline'
order by ordinal_position;
