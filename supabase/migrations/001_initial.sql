create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'operador'
    check (role in ('administrador','operador','consulta')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  president text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gala_tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  name text not null,
  capacity integer not null default 10 check (capacity > 0),
  zone text not null default 'General'
    check (zone in ('Autoridades','Central','General')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  table_id uuid references public.gala_tables(id) on delete set null,
  qr_code text unique default encode(gen_random_bytes(8), 'hex'),
  checked_in boolean not null default false,
  checkin_at timestamptz,
  dietary_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.special_guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text,
  institution text,
  confirmation_status text not null default 'Pendiente'
    check (confirmation_status in ('Confirmado','Pendiente','Declinado')),
  presentation_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists circles_updated_at on public.circles;
create trigger circles_updated_at before update on public.circles
for each row execute function public.set_updated_at();

drop trigger if exists tables_updated_at on public.gala_tables;
create trigger tables_updated_at before update on public.gala_tables
for each row execute function public.set_updated_at();

drop trigger if exists attendees_updated_at on public.attendees;
create trigger attendees_updated_at before update on public.attendees
for each row execute function public.set_updated_at();

drop trigger if exists guests_updated_at on public.special_guests;
create trigger guests_updated_at before update on public.special_guests
for each row execute function public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

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
