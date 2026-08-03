-- ================================================================
-- VERSIÓN 2.3 — CONTROL FINANCIERO
-- Ejecutar en Supabase > SQL Editor.
-- Idempotente.
-- ================================================================

begin;

alter table public.event_config
  add column if not exists adhesion_amount integer not null default 75000
  check (adhesion_amount >= 0);

drop view if exists public.financial_attendee_summary;

create view public.financial_attendee_summary as
select
  a.id as attendee_id,
  a.full_name,
  a.payment_status,
  a.attendance_status,
  a.circle_id,
  c.name as circle_name,
  coalesce(sum(
    case
      when p.status in ('Pagado','Parcial') then p.amount
      else 0
    end
  ),0)::integer as paid_amount,
  case
    when a.payment_status = 'Invitación' then 0
    else ec.adhesion_amount
  end::integer as expected_amount,
  greatest(
    case
      when a.payment_status = 'Invitación' then 0
      else ec.adhesion_amount
    end
    -
    coalesce(sum(
      case
        when p.status in ('Pagado','Parcial') then p.amount
        else 0
      end
    ),0),
    0
  )::integer as balance
from public.attendees a
left join public.circles c on c.id = a.circle_id
left join public.payments p on p.attendee_id = a.id
cross join public.event_config ec
where ec.id = 1
group by
  a.id, a.full_name, a.payment_status, a.attendance_status,
  a.circle_id, c.name, ec.adhesion_amount;

grant select on public.financial_attendee_summary to authenticated;

commit;

select
  count(*) as asistentes,
  sum(expected_amount) as total_esperado,
  sum(paid_amount) as total_recaudado,
  sum(balance) as saldo_pendiente
from public.financial_attendee_summary
where attendance_status <> 'Cancelado';
