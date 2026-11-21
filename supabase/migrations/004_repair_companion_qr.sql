-- Reparación no destructiva: sincroniza cupos y QR en inserciones y ediciones.
-- Ejecutar en Supabase SQL Editor. No elimina asistentes ni pagos.
BEGIN;
CREATE OR REPLACE FUNCTION public.sync_attendee_seats(p_attendee_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a record; i integer; v_name text; v_type text; v_qr text;
BEGIN
 SELECT id,full_name,companion_name,seats_reserved,qr_code INTO a
 FROM public.attendees WHERE id=p_attendee_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Asistente no encontrado.'; END IF;
 FOR i IN 1..greatest(1,coalesce(a.seats_reserved,1)) LOOP
   v_name:=CASE WHEN i=1 THEN a.full_name WHEN i=2 AND nullif(btrim(coalesce(a.companion_name,'')),'') IS NOT NULL THEN a.companion_name ELSE 'Invitado '||i||' de '||a.full_name END;
   v_type:=CASE WHEN i=1 THEN 'Titular' WHEN i=2 AND nullif(btrim(coalesce(a.companion_name,'')),'') IS NOT NULL THEN 'Acompañante' ELSE 'Invitado mesa' END;
   v_qr:=CASE WHEN i=1 THEN a.qr_code WHEN i=2 AND nullif(btrim(coalesce(a.companion_name,'')),'') IS NOT NULL THEN a.qr_code||'-ACOMP' ELSE a.qr_code||'-'||lpad(i::text,2,'0') END;
   INSERT INTO public.attendee_seats(attendee_id,seat_number,guest_name,guest_type,qr_code)
   VALUES(a.id,i,v_name,v_type,v_qr)
   ON CONFLICT(attendee_id,seat_number) DO UPDATE SET
      guest_name=excluded.guest_name,guest_type=excluded.guest_type,
      qr_code=excluded.qr_code;
 END LOOP;
 -- No borrar QR ya utilizados al reducir cupos; exigir revisión manual.
 IF EXISTS(SELECT 1 FROM public.attendee_seats WHERE attendee_id=a.id AND seat_number>greatest(1,coalesce(a.seats_reserved,1)) AND checked_in)
 THEN RAISE EXCEPTION 'No se puede reducir la reserva: existen cupos con ingreso registrado.'; END IF;
 DELETE FROM public.attendee_seats WHERE attendee_id=a.id AND seat_number>greatest(1,coalesce(a.seats_reserved,1));
END;$$;
CREATE OR REPLACE FUNCTION public.trg_sync_attendee_seats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.sync_attendee_seats(NEW.id); RETURN NEW; END;$$;
DROP TRIGGER IF EXISTS attendees_sync_seats ON public.attendees;
CREATE TRIGGER attendees_sync_seats AFTER INSERT OR UPDATE OF full_name,companion_name,seats_reserved,qr_code
ON public.attendees FOR EACH ROW EXECUTE FUNCTION public.trg_sync_attendee_seats();
-- Reconstruye cupos faltantes de registros actuales, preservando QR e ingresos existentes.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT id FROM public.attendees LOOP PERFORM public.sync_attendee_seats(r.id); END LOOP;
END $$;
COMMIT;
