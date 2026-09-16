-- II GRAN GALA NACIONAL 2026
-- CUPOS POR INSCRIPCIÓN: 1 persona, 2 con acompañante o 10 mesa completa
-- Ejecutar una vez en Supabase > SQL Editor.
begin;
alter table public.attendees add column if not exists seats_reserved integer not null default 1;
alter table public.attendees drop constraint if exists attendees_seats_reserved_check;
alter table public.attendees add constraint attendees_seats_reserved_check check (seats_reserved in (1,2,10));

-- Reparación histórica: acompañante = 2 cupos.
update public.attendees set seats_reserved=2
where nullif(btrim(companion_name),'') is not null and seats_reserved<2;

-- Reparación histórica: pago/comprobante de mesa completa = 10 cupos.
update public.attendees a set seats_reserved=10
where exists(select 1 from public.payments p where p.attendee_id=a.id and p.amount>=450000);

drop function if exists public.register_gala_attendee(text,text,text,text,text,text,text,text,text);
drop function if exists public.register_gala_attendee(text,text,text,text,text,text,text,text,text,integer);
create function public.register_gala_attendee(p_full_name text,p_email text,p_phone text,p_circle_name text default null,p_attendance_status text default 'Pendiente',p_companion_name text default null,p_dietary_notes text default null,p_payment_status text default 'Pendiente',p_notes text default null,p_seats_reserved integer default 1)
returns table(attendee_id uuid,registration_code text,portal_token uuid,qr_code text)
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_code text; v_token uuid; v_circle uuid; v_seats integer;
begin
 if btrim(coalesce(p_full_name,''))='' or btrim(coalesce(p_email,''))='' then raise exception 'Nombre y correo son obligatorios.'; end if;
 if exists(select 1 from public.attendees where lower(email)=lower(btrim(p_email)) and attendance_status<>'Cancelado') then raise exception 'Ya existe una inscripción activa con este correo.'; end if;
 v_seats:=case when p_seats_reserved=10 then 10 when nullif(btrim(coalesce(p_companion_name,'')),'') is not null then 2 else 1 end;
 v_code:='ALG-2026-'||lpad(nextval('public.attendee_registration_seq')::text,5,'0'); v_token:=gen_random_uuid();
 if btrim(coalesce(p_circle_name,''))<>'' then select id into v_circle from public.circles where lower(name)=lower(btrim(p_circle_name)) limit 1; end if;
 insert into public.attendees(full_name,email,phone,circle_id,attendance_status,companion_name,seats_reserved,dietary_notes,payment_status,notes,checked_in,qr_code,registration_code,portal_token,validation_status,registration_source,submitted_at)
 values(btrim(p_full_name),lower(btrim(p_email)),nullif(btrim(coalesce(p_phone,'')),''),v_circle,p_attendance_status,nullif(btrim(coalesce(p_companion_name,'')),''),v_seats,nullif(btrim(coalesce(p_dietary_notes,'')),''),p_payment_status,nullif(btrim(coalesce(p_notes,'')),''),false,v_code,v_code,v_token,'Pendiente','Portal Web',now()) returning id into v_id;
 insert into public.attendee_timeline(attendee_id,title,description) values(v_id,'Inscripción recibida','Formulario completado desde el Portal Oficial. Cupos reservados: '||v_seats||'.');
 return query select v_id,v_code,v_token,v_code;
end;$$;
grant execute on function public.register_gala_attendee(text,text,text,text,text,text,text,text,text,integer) to anon,authenticated;

create or replace view public.table_occupancy as
select t.*,coalesce(sum(case when a.attendance_status<>'Cancelado' then coalesce(a.seats_reserved,1) else 0 end),0)::integer occupied,
greatest(t.capacity-coalesce(sum(case when a.attendance_status<>'Cancelado' then coalesce(a.seats_reserved,1) else 0 end),0)::integer,0)::integer available
from public.gala_tables t left join public.attendees a on a.table_id=t.id group by t.id;
commit;

select full_name,companion_name,seats_reserved,payment_status,table_id from public.attendees order by seats_reserved desc,full_name;
