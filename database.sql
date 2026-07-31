-- ================================================================
-- II GRAN GALA NACIONAL DE LOS ALGUACILES DE CHILE 2026
-- Sprint 10.2 — Instalación completa de Supabase
-- Ejecutar una sola vez en: Supabase > SQL Editor > New query > Run
-- El script es idempotente: puede volver a ejecutarse sin duplicar mesas.
-- ================================================================

begin;

create extension if not exists "pgcrypto";

-- CONFIGURACIÓN GENERAL DEL EVENTO
create table if not exists public.event_config (
  id integer primary key default 1 check (id = 1),
  event_name text not null default 'II Gran Gala Nacional de los Alguaciles de Chile 2026',
  event_date timestamptz not null default '2026-11-25 20:00:00-03',
  venue_name text not null default 'Club Palestino',
  venue_address text not null default 'Avenida Presidente Kennedy Nº 9351, Las Condes, Santiago de Chile',
  total_tables integer not null default 23 check (total_tables > 0),
  default_table_capacity integer not null default 10 check (default_table_capacity > 0),
  updated_at timestamptz not null default now()
);

insert into public.event_config (id) values (1)
on conflict (id) do nothing;

-- PERFILES VINCULADOS A SUPABASE AUTH
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'operador'
    check (role in ('administrador','comite','operador','consulta')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CÍRCULOS
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  president text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MESAS
create table if not exists public.gala_tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique check (table_number > 0),
  name text not null,
  capacity integer not null default 10 check (capacity > 0),
  zone text not null default 'General'
    check (zone in ('Protocolar','Autoridades','Central','General','Reserva')),
  status text not null default 'Disponible'
    check (status in ('Disponible','Reservada','Cerrada')),
  responsible text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ASISTENTES
create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  institution text,
  position_title text,
  circle_id uuid references public.circles(id) on delete set null,
  companion_name text,
  payment_status text not null default 'Pendiente'
    check (payment_status in ('Pagado','Pendiente','Parcial','Invitación')),
  attendance_status text not null default 'Pendiente'
    check (attendance_status in ('Confirmado','Pendiente','Cancelado')),
  protocol_category text,
  table_id uuid references public.gala_tables(id) on delete set null,
  qr_code text unique default encode(gen_random_bytes(8), 'hex'),
  checked_in boolean not null default false,
  checkin_at timestamptz,
  dietary_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PAGOS
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CAMPAÑAS DE CORREO
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text,
  segment text not null,
  recipients integer not null default 0,
  status text not null default 'Borrador'
    check (status in ('Borrador','Programado','Enviado','Error')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- BITÁCORA
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- COMPATIBILIDAD CON INSTALACIONES ANTERIORES
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('administrador','comite','operador','consulta'));

alter table public.gala_tables add column if not exists status text not null default 'Disponible';
alter table public.gala_tables add column if not exists responsible text;
alter table public.gala_tables add column if not exists notes text;
alter table public.gala_tables add column if not exists updated_at timestamptz not null default now();
alter table public.gala_tables drop constraint if exists gala_tables_zone_check;
alter table public.gala_tables add constraint gala_tables_zone_check
  check (zone in ('Protocolar','Autoridades','Central','General','Reserva'));
alter table public.gala_tables drop constraint if exists gala_tables_status_check;
alter table public.gala_tables add constraint gala_tables_status_check
  check (status in ('Disponible','Reservada','Cerrada'));

alter table public.attendees add column if not exists institution text;
alter table public.attendees add column if not exists position_title text;
alter table public.attendees add column if not exists protocol_category text;
alter table public.attendees add column if not exists dietary_notes text;
alter table public.attendees add column if not exists updated_at timestamptz not null default now();
alter table public.circles add column if not exists updated_at timestamptz not null default now();
alter table public.payments add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.email_campaigns add column if not exists body text;

-- ACTUALIZACIÓN AUTOMÁTICA DE updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists circles_updated_at on public.circles;
create trigger circles_updated_at before update on public.circles
for each row execute function public.set_updated_at();

drop trigger if exists tables_updated_at on public.gala_tables;
create trigger tables_updated_at before update on public.gala_tables
for each row execute function public.set_updated_at();

drop trigger if exists attendees_updated_at on public.attendees;
create trigger attendees_updated_at before update on public.attendees
for each row execute function public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

-- PERFIL AUTOMÁTICO PARA NUEVOS USUARIOS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'operador')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Crea perfiles para usuarios Auth que ya existían antes de ejecutar el script.
insert into public.profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', email), 'operador'
from auth.users
on conflict (id) do nothing;

-- El primer usuario existente queda como administrador.
update public.profiles
set role = 'administrador'
where id = (select id from auth.users order by created_at asc limit 1);

-- 23 MESAS PROTOCOLARIAS OFICIALES
insert into public.gala_tables (table_number, name, capacity, zone, status)
values
 (1,  'Mesa Presidencial',                 10, 'Protocolar',  'Reservada'),
 (2,  'Autoridades Nacionales',            10, 'Autoridades', 'Reservada'),
 (3,  'Autoridades Institucionales',       10, 'Autoridades', 'Reservada'),
 (4,  'Directorio Nacional',               10, 'Autoridades', 'Reservada'),
 (5,  'Círculo Servicios Diplomáticos',    10, 'Central',     'Disponible'),
 (6,  'Círculo Santiago',                  10, 'Central',     'Disponible'),
 (7,  'Círculo Las Condes',                10, 'Central',     'Disponible'),
 (8,  'Círculo Providencia',               10, 'Central',     'Disponible'),
 (9,  'Círculo Norte',                     10, 'Central',     'Disponible'),
 (10, 'Círculo Sur',                       10, 'Central',     'Disponible'),
 (11, 'Círculo Oriente',                   10, 'Central',     'Disponible'),
 (12, 'Círculo Poniente',                  10, 'Central',     'Disponible'),
 (13, 'Invitados Especiales',              10, 'Autoridades', 'Reservada'),
 (14, 'Carabineros de Chile',              10, 'Autoridades', 'Reservada'),
 (15, 'Instituciones Amigas',              10, 'General',     'Disponible'),
 (16, 'Patrocinadores',                    10, 'General',     'Disponible'),
 (17, 'Delegaciones Regionales',           10, 'General',     'Disponible'),
 (18, 'Alguaciles I',                      10, 'General',     'Disponible'),
 (19, 'Alguaciles II',                     10, 'General',     'Disponible'),
 (20, 'Alguaciles III',                    10, 'General',     'Disponible'),
 (21, 'Alguaciles IV',                     10, 'General',     'Disponible'),
 (22, 'Familia e Invitados',               10, 'General',     'Disponible'),
 (23, 'Mesa de Reserva',                   10, 'Reserva',     'Reservada')
on conflict (table_number) do update set
  name = excluded.name,
  zone = excluded.zone,
  status = excluded.status;

-- ÍNDICES
create index if not exists attendees_name_idx on public.attendees using gin (to_tsvector('simple', full_name));
create index if not exists attendees_circle_idx on public.attendees(circle_id);
create index if not exists attendees_table_idx on public.attendees(table_id);
create index if not exists attendees_status_idx on public.attendees(attendance_status);
create index if not exists attendees_checkin_idx on public.attendees(checked_in);
create index if not exists attendees_qr_idx on public.attendees(qr_code);
create index if not exists payments_attendee_idx on public.payments(attendee_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists circles_name_idx on public.circles(name);

-- VISTAS PARA DASHBOARD Y MESAS
create or replace view public.dashboard_metrics as
select
  (select count(*) from public.attendees) as registered,
  (select count(*) from public.attendees where attendance_status = 'Confirmado') as confirmed,
  (select count(*) from public.attendees where checked_in) as checked_in,
  (select count(*) from public.attendees where payment_status = 'Pendiente') as payment_pending,
  (select coalesce(sum(amount),0) from public.payments where status in ('Pagado','Parcial')) as collected,
  (select count(*) from public.gala_tables) as total_tables,
  (select coalesce(sum(capacity),0) from public.gala_tables) as total_capacity,
  (select count(*) from public.attendees where table_id is not null) as assigned_seats;

create or replace view public.table_occupancy as
select
  t.id,
  t.table_number,
  t.name,
  t.capacity,
  t.zone,
  t.status,
  t.responsible,
  t.notes,
  count(a.id)::integer as occupied,
  greatest(t.capacity - count(a.id), 0)::integer as available
from public.gala_tables t
left join public.attendees a on a.table_id = t.id
group by t.id, t.table_number, t.name, t.capacity, t.zone, t.status, t.responsible, t.notes;

-- SEGURIDAD RLS
alter table public.event_config enable row level security;
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.gala_tables enable row level security;
alter table public.attendees enable row level security;
alter table public.payments enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "authenticated event config" on public.event_config;
create policy "authenticated event config" on public.event_config
for all to authenticated using (true) with check (true);

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "authenticated circles" on public.circles;
create policy "authenticated circles" on public.circles
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated tables" on public.gala_tables;
create policy "authenticated tables" on public.gala_tables
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated gala_tables" on public.gala_tables;
drop policy if exists "authenticated attendees" on public.attendees;
create policy "authenticated attendees" on public.attendees
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated payments" on public.payments;
create policy "authenticated payments" on public.payments
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated campaigns" on public.email_campaigns;
create policy "authenticated campaigns" on public.email_campaigns
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated audit read" on public.audit_log;
create policy "authenticated audit read" on public.audit_log
for select to authenticated using (true);

drop policy if exists "authenticated audit insert" on public.audit_log;
create policy "authenticated audit insert" on public.audit_log
for insert to authenticated with check (user_id = auth.uid() or user_id is null);

-- Permisos sobre vistas para usuarios autenticados.
grant select on public.dashboard_metrics to authenticated;
grant select on public.table_occupancy to authenticated;

commit;

-- VERIFICACIÓN FINAL: debe devolver 23.
select count(*) as total_mesas from public.gala_tables;
