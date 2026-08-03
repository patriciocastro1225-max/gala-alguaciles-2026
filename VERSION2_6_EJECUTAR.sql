-- ================================================================
-- VERSIÓN 2.6 — COMUNICACIONES AVANZADAS
-- Historial individual de entregas de correo.
-- Ejecutar en Supabase > SQL Editor.
-- Idempotente.
-- ================================================================

begin;

create table if not exists public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid references public.attendees(id) on delete set null,
  campaign_id uuid references public.email_campaigns(id) on delete set null,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  template_key text,
  provider text not null default 'Resend',
  provider_message_id text,
  status text not null default 'Enviado'
    check (status in ('Enviado','Error')),
  error_message text,
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now()
);

create index if not exists email_delivery_log_attendee_idx
  on public.email_delivery_log(attendee_id);

create index if not exists email_delivery_log_sent_at_idx
  on public.email_delivery_log(sent_at desc);

alter table public.email_delivery_log enable row level security;

drop policy if exists "email_delivery_log_authenticated_all"
  on public.email_delivery_log;

create policy "email_delivery_log_authenticated_all"
on public.email_delivery_log
for all
to authenticated
using (true)
with check (true);

commit;

select
  count(*) as entregas_registradas
from public.email_delivery_log;
