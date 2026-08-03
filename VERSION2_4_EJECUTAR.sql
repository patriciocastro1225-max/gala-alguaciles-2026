-- ================================================================
-- VERSIÓN 2.4 — OPERACIÓN DÍA DEL EVENTO
-- Check-in manual, acompañantes, incidencias y control de acceso.
-- Ejecutar en Supabase > SQL Editor.
-- Idempotente.
-- ================================================================

begin;

alter table public.attendees
  add column if not exists companion_checked_in boolean not null default false;

alter table public.attendees
  add column if not exists companion_checkin_at timestamptz;

alter table public.attendees
  add column if not exists access_notes text;

create table if not exists public.event_incidents (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid references public.attendees(id) on delete set null,
  incident_type text not null,
  description text not null,
  resolved boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.event_incidents enable row level security;

drop policy if exists "event_incidents_authenticated_all" on public.event_incidents;
create policy "event_incidents_authenticated_all"
on public.event_incidents
for all
to authenticated
using (true)
with check (true);

create or replace function public.check_in_companion(p_attendee_id uuid)
returns table (
  attendee_id uuid,
  companion_name text,
  companion_checked_in boolean,
  companion_checkin_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado.';
  end if;

  if not exists (
    select 1
    from public.attendees
    where id = p_attendee_id
      and companion_name is not null
      and btrim(companion_name) <> ''
  ) then
    raise exception 'Este asistente no tiene acompañante registrado.';
  end if;

  if exists (
    select 1 from public.attendees
    where id = p_attendee_id and companion_checked_in = true
  ) then
    raise exception 'El acompañante ya registró su ingreso.';
  end if;

  update public.attendees
  set companion_checked_in = true,
      companion_checkin_at = now()
  where id = p_attendee_id;

  insert into public.audit_log(user_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    'CHECK_IN_COMPANION',
    'attendee',
    p_attendee_id::text,
    jsonb_build_object('timestamp', now())
  );

  return query
  select
    a.id,
    a.companion_name,
    a.companion_checked_in,
    a.companion_checkin_at
  from public.attendees a
  where a.id = p_attendee_id;
end;
$$;

revoke all on function public.check_in_companion(uuid) from public;
grant execute on function public.check_in_companion(uuid) to authenticated;

commit;

select
  count(*) as asistentes,
  count(*) filter (where checked_in) as acreditados,
  count(*) filter (where companion_name is not null and btrim(companion_name) <> '') as con_acompanante,
  count(*) filter (where companion_checked_in) as acompanantes_ingresados
from public.attendees;
