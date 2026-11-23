-- Ejecutar manualmente en Supabase SQL Editor tras revisar las políticas existentes.
-- Restringe operaciones directas de la cuenta de recepción. No modifica datos de invitados.
begin;
create or replace function public.is_gala_reception_operator()
returns boolean language sql stable security definer set search_path=public,auth
as $$
  select exists(select 1 from auth.users where id=auth.uid() and lower(email)='pcastro@brastore.cl');
$$;
revoke all on function public.is_gala_reception_operator() from public;
grant execute on function public.is_gala_reception_operator() to authenticated;
insert into public.profiles(id,full_name,role,active)
select id,'OPERADOR','operador',true from auth.users where lower(email)='pcastro@brastore.cl'
on conflict(id) do update set full_name='OPERADOR',role='operador',active=true;
-- Restringe tablas existentes para este usuario; las demás cuentas no se ven afectadas.
do $$
declare t record; allowed boolean;
begin
 for t in select tablename from pg_tables where schemaname='public' loop
   execute format('alter table public.%I enable row level security',t.tablename);
   allowed:=t.tablename in ('attendees','attendee_seats','circles','gala_tables','profiles');
   execute format('drop policy if exists gala_operator_read_guard on public.%I',t.tablename);
   execute format('create policy gala_operator_read_guard on public.%I as restrictive for select to authenticated using (not public.is_gala_reception_operator() %s)',t.tablename,case when allowed then 'or true' else '' end);
   execute format('drop policy if exists gala_operator_insert_guard on public.%I',t.tablename);
   execute format('create policy gala_operator_insert_guard on public.%I as restrictive for insert to authenticated with check (not public.is_gala_reception_operator())',t.tablename);
   execute format('drop policy if exists gala_operator_update_guard on public.%I',t.tablename);
   execute format('create policy gala_operator_update_guard on public.%I as restrictive for update to authenticated using (not public.is_gala_reception_operator()) with check (not public.is_gala_reception_operator())',t.tablename);
   execute format('drop policy if exists gala_operator_delete_guard on public.%I',t.tablename);
   execute format('create policy gala_operator_delete_guard on public.%I as restrictive for delete to authenticated using (not public.is_gala_reception_operator())',t.tablename);
 end loop;
end $$;
commit;
-- Nota: las funciones SECURITY DEFINER y vistas deben auditarse aparte;
-- el check-in usa la RPC existente check_in_attendee.
