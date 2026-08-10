-- ================================================================
-- VERSION 3.0.3.3 — COMUNICACIONES AVANZADAS
-- Ejecutar en Supabase > SQL Editor > New query > Run
--
-- Crea las tablas requeridas por Administración > Comunicaciones:
--   public.email_campaigns
--   public.email_delivery_log
-- No elimina datos existentes.
-- ================================================================

begin;

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text,
  segment text not null default 'Selección general',
  recipients integer not null default 0,
  failed integer not null default 0,
  status text not null default 'Enviado',
  provider text not null default 'Resend',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid references public.attendees(id) on delete set null,
  campaign_id uuid references public.email_campaigns(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  template_key text,
  provider text not null default 'Resend',
  provider_message_id text,
  status text not null default 'Enviado',
  error_message text,
  sent_by uuid,
  sent_at timestamptz not null default now()
);

create index if not exists email_campaigns_created_at_idx
  on public.email_campaigns(created_at desc);

create index if not exists email_delivery_log_sent_at_idx
  on public.email_delivery_log(sent_at desc);

create index if not exists email_delivery_log_attendee_idx
  on public.email_delivery_log(attendee_id);

alter table public.email_campaigns enable row level security;
alter table public.email_delivery_log enable row level security;

drop policy if exists "authenticated email campaigns" on public.email_campaigns;
create policy "authenticated email campaigns"
on public.email_campaigns
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated email delivery log" on public.email_delivery_log;
create policy "authenticated email delivery log"
on public.email_delivery_log
for all
to authenticated
using (true)
with check (true);

commit;

-- VERIFICACIÓN
select 'email_campaigns' as tabla, count(*) as registros from public.email_campaigns
union all
select 'email_delivery_log' as tabla, count(*) as registros from public.email_delivery_log;
