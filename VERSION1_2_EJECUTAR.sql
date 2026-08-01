-- ================================================================
-- VERSIÓN 1.2 — OPERACIÓN
-- QR, check-in atómico, operador de ingreso y campañas de correo.
-- Ejecutar una vez en Supabase > SQL Editor.
-- Es idempotente: puede volver a ejecutarse.
-- ================================================================

begin;

alter table public.attendees
  add column if not exists checked_in_by uuid references auth.users(id) on delete set null;

alter table public.email_campaigns
  add column if not exists failed integer not null default 0;

alter table public.email_campaigns
  add column if not exists provider text default 'Resend';

-- Check-in atómico. Evita que dos dispositivos acrediten el mismo QR a la vez.
create or replace function public.check_in_attendee(p_qr_code text)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  companion_name text,
  payment_status text,
  attendance_status text,
  checked_in boolean,
  checkin_at timestamptz,
  qr_code text,
  dietary_notes text,
  notes text,
  circle_id uuid,
  table_id uuid,
  circle_name text,
  table_name text,
  table_number integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado.';
  end if;

  select a.id into v_id
  from public.attendees a
  where a.qr_code = btrim(p_qr_code)
  for update;

  if v_id is null then
    raise exception 'Código no encontrado.';
  end if;

  if exists (
    select 1 from public.attendees a
    where a.id = v_id and a.checked_in = true
  ) then
    raise exception 'Este asistente ya registró su ingreso.';
  end if;

  update public.attendees
  set checked_in = true,
      checkin_at = now(),
      checked_in_by = auth.uid()
  where public.attendees.id = v_id;

  insert into public.audit_log(user_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    'CHECK_IN',
    'attendee',
    v_id::text,
    jsonb_build_object('source','qr_or_manual','timestamp',now())
  );

  return query
  select
    a.id, a.full_name, a.email, a.phone, a.companion_name,
    a.payment_status, a.attendance_status, a.checked_in, a.checkin_at,
    a.qr_code, a.dietary_notes, a.notes, a.circle_id, a.table_id,
    c.name as circle_name,
    t.name as table_name,
    t.table_number
  from public.attendees a
  left join public.circles c on c.id = a.circle_id
  left join public.gala_tables t on t.id = a.table_id
  where a.id = v_id;
end;
$$;

revoke all on function public.check_in_attendee(text) from public;
grant execute on function public.check_in_attendee(text) to authenticated;

commit;

select
  count(*) as total_asistentes,
  count(*) filter (where qr_code is not null and btrim(qr_code) <> '') as con_qr,
  count(*) filter (where checked_in) as acreditados
from public.attendees;
