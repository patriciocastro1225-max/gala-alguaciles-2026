-- ================================================================
-- VERSIÓN 3.0.2.7 — CORRECCIÓN RLS DE INSCRIPCIÓN PÚBLICA
-- Ejecutar en Supabase > SQL Editor > New query > Run
--
-- Objetivo:
--   Permitir que la inscripción pública opere ÚNICAMENTE mediante
--   la función controlada register_gala_attendee(), sin abrir acceso
--   directo anónimo a las tablas attendees/circles/timeline.
--
-- Este script NO desactiva RLS y NO crea políticas públicas amplias.
-- Es seguro volver a ejecutarlo.
-- ================================================================

begin;

-- 1) Mantener RLS habilitado en las tablas sensibles.
alter table if exists public.attendees enable row level security;
alter table if exists public.circles enable row level security;
alter table if exists public.payments enable row level security;

-- attendee_timeline puede no existir en instalaciones antiguas.
do $$
begin
  if to_regclass('public.attendee_timeline') is not null then
    execute 'alter table public.attendee_timeline enable row level security';
  end if;
end $$;

-- 2) La función pública de inscripción debe ejecutarse con los permisos
--    de su propietario (SECURITY DEFINER). Así la función puede insertar
--    los registros necesarios sin conceder INSERT directo al rol anon.
do $$
declare
  r record;
begin
  for r in
    select
      p.oid,
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'register_gala_attendee'
  loop
    execute format(
      'alter function %I.%I(%s) security definer',
      r.schema_name,
      r.function_name,
      r.identity_args
    );

    execute format(
      'alter function %I.%I(%s) set search_path = public, pg_temp',
      r.schema_name,
      r.function_name,
      r.identity_args
    );

    execute format(
      'grant execute on function %I.%I(%s) to anon, authenticated',
      r.schema_name,
      r.function_name,
      r.identity_args
    );
  end loop;
end $$;

-- 3) La función de comprobante también debe conservar el mismo modelo
--    seguro. Se incluye para dejar ambos flujos consistentes.
do $$
declare
  r record;
begin
  for r in
    select
      p.oid,
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'register_payment_receipt'
  loop
    execute format(
      'alter function %I.%I(%s) security definer',
      r.schema_name,
      r.function_name,
      r.identity_args
    );

    execute format(
      'alter function %I.%I(%s) set search_path = public, pg_temp',
      r.schema_name,
      r.function_name,
      r.identity_args
    );

    execute format(
      'grant execute on function %I.%I(%s) to anon, authenticated',
      r.schema_name,
      r.function_name,
      r.identity_args
    );
  end loop;
end $$;

commit;

-- ================================================================
-- VERIFICACIÓN
-- Debe mostrar register_gala_attendee con security_definer = true.
-- ================================================================
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('register_gala_attendee','register_payment_receipt')
order by p.proname;
