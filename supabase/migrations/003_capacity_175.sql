-- Aforo máximo: 175 personas. Ejecutar en Supabase SQL Editor.
-- No elimina ni modifica inscripciones existentes.
BEGIN;
CREATE OR REPLACE FUNCTION public.gala_available_seats()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT greatest(0,175-coalesce(sum(greatest(1,coalesce(seats_reserved,1))),0)::integer)
 FROM public.attendees WHERE attendance_status IS DISTINCT FROM 'Cancelado';
$$;
REVOKE ALL ON FUNCTION public.gala_available_seats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gala_available_seats() TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.register_gala_attendee(
 p_full_name text,p_email text,p_phone text,p_circle_name text DEFAULT null,
 p_attendance_status text DEFAULT 'Pendiente',p_companion_name text DEFAULT null,
 p_dietary_notes text DEFAULT null,p_payment_status text DEFAULT 'Pendiente',
 p_notes text DEFAULT null,p_seats_reserved integer DEFAULT 1)
RETURNS TABLE(attendee_id uuid,registration_code text,portal_token uuid,qr_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_code text; v_token uuid; v_circle uuid; v_seats integer; v_occupied integer;
BEGIN
 IF btrim(coalesce(p_full_name,''))='' OR btrim(coalesce(p_email,''))='' THEN RAISE EXCEPTION 'Nombre y correo son obligatorios.'; END IF;
 v_seats:=p_seats_reserved;
 IF v_seats IS NULL OR v_seats<1 OR v_seats>12 THEN RAISE EXCEPTION 'La cantidad de cupos debe estar entre 1 y 12.'; END IF;
 IF nullif(btrim(coalesce(p_companion_name,'')),'') IS NOT NULL AND v_seats<2 THEN RAISE EXCEPTION 'Un acompañante requiere al menos dos cupos.'; END IF;
 -- Serializa inscripciones concurrentes para evitar sobreventa.
 PERFORM pg_advisory_xact_lock(2026,175);
 SELECT coalesce(sum(greatest(1,coalesce(seats_reserved,1))),0)::integer INTO v_occupied
 FROM public.attendees WHERE attendance_status IS DISTINCT FROM 'Cancelado';
 IF v_occupied+v_seats>175 THEN
   RAISE EXCEPTION 'EVENTO COMPLETO. Solo quedan % cupos disponibles.',greatest(0,175-v_occupied);
 END IF;
 IF EXISTS(SELECT 1 FROM public.attendees WHERE lower(email)=lower(btrim(p_email)) AND attendance_status<>'Cancelado')
 THEN RAISE EXCEPTION 'Ya existe una inscripción activa con este correo.'; END IF;
 v_code:='ALG-2026-'||lpad(nextval('public.attendee_registration_seq')::text,5,'0');
 v_token:=gen_random_uuid();
 IF btrim(coalesce(p_circle_name,''))<>'' THEN
  SELECT id INTO v_circle FROM public.circles WHERE lower(name)=lower(btrim(p_circle_name)) LIMIT 1;
 END IF;
 INSERT INTO public.attendees(full_name,email,phone,circle_id,attendance_status,companion_name,seats_reserved,dietary_notes,payment_status,notes,checked_in,qr_code,registration_code,portal_token,validation_status,registration_source,submitted_at)
 VALUES(btrim(p_full_name),lower(btrim(p_email)),nullif(btrim(coalesce(p_phone,'')),''),v_circle,'Confirmado',nullif(btrim(coalesce(p_companion_name,'')),''),v_seats,nullif(btrim(coalesce(p_dietary_notes,'')),''),'Pendiente',nullif(btrim(coalesce(p_notes,'')),''),false,v_code,v_code,v_token,'Pendiente','Portal Web',now())
 RETURNING id INTO v_id;
 INSERT INTO public.attendee_timeline(attendee_id,title,description)
 VALUES(v_id,'Inscripción recibida','Formulario completado desde el Portal Oficial. Cupos reservados: '||v_seats||'.');
 RETURN QUERY SELECT v_id,v_code,v_token,v_code;
END;$$;
REVOKE ALL ON FUNCTION public.register_gala_attendee(text,text,text,text,text,text,text,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_gala_attendee(text,text,text,text,text,text,text,text,text,integer) TO anon,authenticated;
COMMIT;
