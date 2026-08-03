-- ================================================================
-- VERSIÓN 2.5 — REPORTES FINALES Y CIERRE DE LA GALA
-- Ejecutar en Supabase > SQL Editor.
-- Idempotente.
-- ================================================================

begin;

create table if not exists public.event_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_name text not null,
  snapshot_type text not null default 'Cierre'
    check (snapshot_type in ('Cierre','Parcial','Respaldo')),
  metrics jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.event_snapshots enable row level security;

drop policy if exists "event_snapshots_authenticated_all" on public.event_snapshots;
create policy "event_snapshots_authenticated_all"
on public.event_snapshots
for all
to authenticated
using (true)
with check (true);

create or replace function public.event_final_metrics()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_registrados',
      (select count(*) from public.attendees where attendance_status <> 'Cancelado'),
    'confirmados',
      (select count(*) from public.attendees where attendance_status = 'Confirmado'),
    'acreditados',
      (select count(*) from public.attendees where checked_in = true),
    'acompanantes_registrados',
      (select count(*) from public.attendees where companion_name is not null and btrim(companion_name) <> ''),
    'acompanantes_acreditados',
      (select count(*) from public.attendees where companion_checked_in = true),
    'mesas',
      (select count(*) from public.gala_tables),
    'capacidad_total',
      (select coalesce(sum(capacity),0) from public.gala_tables),
    'recaudado',
      (select coalesce(sum(amount),0) from public.payments where status in ('Pagado','Parcial')),
    'pagos_registrados',
      (select count(*) from public.payments),
    'incidencias_totales',
      (select count(*) from public.event_incidents),
    'incidencias_abiertas',
      (select count(*) from public.event_incidents where resolved = false),
    'generado_en',
      now()
  );
$$;

revoke all on function public.event_final_metrics() from public;
grant execute on function public.event_final_metrics() to authenticated;

commit;

select public.event_final_metrics() as metricas_finales;
