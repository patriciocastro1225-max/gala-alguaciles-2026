-- Actualización Gala 2026: inscripciones de 1 a 12 cupos.
-- Ejecutar en Supabase SQL Editor antes de probar reservas de 3 a 12.
BEGIN;
ALTER TABLE public.attendees DROP CONSTRAINT IF EXISTS attendees_seats_reserved_check;
ALTER TABLE public.attendees ADD CONSTRAINT attendees_seats_reserved_check CHECK (seats_reserved BETWEEN 1 AND 12);
drop function if exists public.register_gala_attendee(text,text,text,text,text,text,text,text,text);
drop function if exists public.register_gala_attendee(text,text,text,text,text,text,text,text,text,integer);
create function public.register_gala_attendee(p_full_name text,p_email text,p_phone text,p_circle_name text default null,p_attendance_status text default 'Pendiente',p_companion_name text default null,p_dietary_notes text default null,p_payment_status text default 'Pendiente',p_notes text default null,p_seats_reserved integer default 1)
returns table(attendee_id uuid,registration_code text,portal_token uuid,qr_code text)
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_code text; v_token uuid; v_circle uuid; v_seats integer;
begin
 if btrim(coalesce(p_full_name,''))='' or btrim(coalesce(p_email,''))='' then raise exception 'Nombre y correo son obligatorios.'; end if;
 if exists(select 1 from public.attendees where lower(email)=lower(btrim(p_email)) and attendance_status<>'Cancelado') then raise exception 'Ya existe una inscripción activa con este correo.'; end if;
 v_seats:=p_seats_reserved; if v_seats is null or v_seats<1 or v_seats>12 then raise exception 'La cantidad de cupos debe estar entre 1 y 12.'; end if; if nullif(btrim(coalesce(p_companion_name,'')),'') is not null and v_seats<2 then raise exception 'Un acompañante requiere al menos dos cupos.'; end if;
 v_code:='ALG-2026-'||lpad(nextval('public.attendee_registration_seq')::text,5,'0'); v_token:=gen_random_uuid();
 if btrim(coalesce(p_circle_name,''))<>'' then select id into v_circle from public.circles where lower(name)=lower(btrim(p_circle_name)) limit 1; end if;
 insert into public.attendees(full_name,email,phone,circle_id,attendance_status,companion_name,seats_reserved,dietary_notes,payment_status,notes,checked_in,qr_code,registration_code,portal_token,validation_status,registration_source,submitted_at)
 values(btrim(p_full_name),lower(btrim(p_email)),nullif(btrim(coalesce(p_phone,'')),''),v_circle,p_attendance_status,nullif(btrim(coalesce(p_companion_name,'')),''),v_seats,nullif(btrim(coalesce(p_dietary_notes,'')),''),p_payment_status,nullif(btrim(coalesce(p_notes,'')),''),false,v_code,v_code,v_token,'Pendiente','Portal Web',now()) returning id into v_id;
 insert into public.attendee_timeline(attendee_id,title,description) values(v_id,'Inscripción recibida','Formulario completado desde el Portal Oficial. Cupos reservados: '||v_seats||'.');
 return query select v_id,v_code,v_token,v_code;
end;$$;
grant execute on function public.register_gala_attendee(text,text,text,text,text,text,text,text,text,integer) to anon,authenticated;


COMMIT;
