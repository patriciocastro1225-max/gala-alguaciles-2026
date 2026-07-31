-- SPRINT 10.4 — QR, acreditación y registro de correos
create extension if not exists pgcrypto;

alter table public.attendees add column if not exists qr_code text;
update public.attendees
set qr_code = 'GALA2026-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))
where qr_code is null or btrim(qr_code) = '';
alter table public.attendees alter column qr_code set not null;
create unique index if not exists attendees_qr_code_unique on public.attendees(qr_code);

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid references public.attendees(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  provider text not null default 'Resend',
  provider_message_id text,
  status text not null default 'Pendiente' check(status in ('Pendiente','Enviado','Error')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.email_deliveries enable row level security;
drop policy if exists "Authenticated users manage email deliveries" on public.email_deliveries;
create policy "Authenticated users manage email deliveries" on public.email_deliveries
for all to authenticated using (true) with check (true);

select count(*) as asistentes_con_qr from public.attendees where qr_code is not null;
