-- II Gran Gala Nacional de los Alguaciles de Chile 2026
-- Ejecutar completo en Supabase > SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  president text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  circle_id uuid references public.circles(id) on delete set null,
  companion_name text,
  payment_status text not null default 'Pendiente'
    check (payment_status in ('Pagado','Pendiente','Parcial','Invitación')),
  attendance_status text not null default 'Pendiente'
    check (attendance_status in ('Confirmado','Pendiente','Cancelado')),
  table_id uuid,
  qr_code text unique default encode(gen_random_bytes(8), 'hex'),
  checked_in boolean not null default false,
  checkin_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.gala_tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  name text not null,
  capacity integer not null default 10 check (capacity > 0),
  zone text not null default 'General'
    check (zone in ('Autoridades','Central','General')),
  created_at timestamptz not null default now()
);

alter table public.attendees
  drop constraint if exists attendees_table_id_fkey;

alter table public.attendees
  add constraint attendees_table_id_fkey
  foreign key (table_id) references public.gala_tables(id) on delete set null;

create table if not exists public.special_guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text,
  institution text,
  confirmation_status text not null default 'Pendiente'
    check (confirmation_status in ('Confirmado','Pendiente','Declinado')),
  presentation_order integer not null default 1,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  amount integer not null default 0 check (amount >= 0),
  method text not null default 'Transferencia'
    check (method in ('Transferencia','Webpay','Efectivo','Invitación')),
  status text not null default 'Pendiente'
    check (status in ('Pagado','Pendiente','Parcial')),
  payment_date date,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  segment text not null,
  recipients integer not null default 0,
  status text not null default 'Borrador'
    check (status in ('Borrador','Programado','Enviado','Error')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Seguridad
alter table public.circles enable row level security;
alter table public.attendees enable row level security;
alter table public.gala_tables enable row level security;
alter table public.special_guests enable row level security;
alter table public.payments enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.audit_log enable row level security;

-- El panel solo funciona para usuarios autenticados.
create policy "authenticated circles" on public.circles
for all to authenticated using (true) with check (true);

create policy "authenticated attendees" on public.attendees
for all to authenticated using (true) with check (true);

create policy "authenticated gala_tables" on public.gala_tables
for all to authenticated using (true) with check (true);

create policy "authenticated special_guests" on public.special_guests
for all to authenticated using (true) with check (true);

create policy "authenticated payments" on public.payments
for all to authenticated using (true) with check (true);

create policy "authenticated campaigns" on public.email_campaigns
for all to authenticated using (true) with check (true);

create policy "authenticated audit" on public.audit_log
for select to authenticated using (true);

create policy "authenticated audit insert" on public.audit_log
for insert to authenticated with check (true);

-- Mesas iniciales
insert into public.gala_tables (table_number, name, capacity, zone)
select
  n,
  case when n = 1 then 'Mesa Presidencial' else 'Mesa ' || n end,
  10,
  case
    when n <= 3 then 'Autoridades'
    when n <= 14 then 'Central'
    else 'General'
  end
from generate_series(1,22) as n
on conflict (table_number) do nothing;
