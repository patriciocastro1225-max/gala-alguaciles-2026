-- II GRAN GALA NACIONAL 2026
-- QR INDIVIDUAL POR CUPO
-- Ejecutar una vez en Supabase > SQL Editor

BEGIN;

CREATE TABLE IF NOT EXISTS public.attendee_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id uuid NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  guest_name text NOT NULL,
  guest_type text NOT NULL DEFAULT 'Invitado',
  qr_code text NOT NULL UNIQUE,
  checked_in boolean NOT NULL DEFAULT false,
  checkin_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(attendee_id, seat_number)
);

ALTER TABLE public.attendee_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendee_seats_authenticated_select ON public.attendee_seats;
CREATE POLICY attendee_seats_authenticated_select ON public.attendee_seats
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS attendee_seats_authenticated_update ON public.attendee_seats;
CREATE POLICY attendee_seats_authenticated_update ON public.attendee_seats
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Crea/repara los accesos individuales de todos los inscritos actuales.
CREATE OR REPLACE FUNCTION public.sync_attendee_seats(p_attendee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  a record;
  i integer;
  v_name text;
  v_type text;
  v_qr text;
BEGIN
  SELECT id, full_name, companion_name, seats_reserved, qr_code
  INTO a
  FROM public.attendees
  WHERE id=p_attendee_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Asistente no encontrado.'; END IF;

  FOR i IN 1..COALESCE(a.seats_reserved,1) LOOP
    IF i=1 THEN
      v_name:=a.full_name;
      v_type:='Titular';
      v_qr:=a.qr_code;
    ELSIF i=2 AND NULLIF(BTRIM(COALESCE(a.companion_name,'')),'') IS NOT NULL THEN
      v_name:=a.companion_name;
      v_type:='Acompañante';
      v_qr:=a.qr_code||'-ACOMP';
    ELSE
      v_name:='Invitado '||i||' de '||a.full_name;
      v_type:='Invitado mesa';
      v_qr:=a.qr_code||'-'||LPAD(i::text,2,'0');
    END IF;

    INSERT INTO public.attendee_seats(attendee_id,seat_number,guest_name,guest_type,qr_code)
    VALUES(a.id,i,v_name,v_type,v_qr)
    ON CONFLICT(attendee_id,seat_number) DO UPDATE
      SET guest_name=EXCLUDED.guest_name,
          guest_type=EXCLUDED.guest_type,
          qr_code=EXCLUDED.qr_code;
  END LOOP;

  DELETE FROM public.attendee_seats
  WHERE attendee_id=a.id AND seat_number>COALESCE(a.seats_reserved,1);
END;
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.attendees LOOP
    PERFORM public.sync_attendee_seats(r.id);
  END LOOP;
END $$;

-- Mantiene los QR sincronizados si cambia nombre, acompañante o cantidad de cupos.
CREATE OR REPLACE FUNCTION public.trg_sync_attendee_seats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.sync_attendee_seats(NEW.id);
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS attendees_sync_seats ON public.attendees;
CREATE TRIGGER attendees_sync_seats
AFTER INSERT OR UPDATE OF full_name, companion_name, seats_reserved, qr_code
ON public.attendees
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_attendee_seats();

-- Devuelve todos los QR de una inscripción para comunicaciones.
CREATE OR REPLACE FUNCTION public.get_attendee_seats(p_attendee_id uuid)
RETURNS TABLE(seat_number integer, guest_name text, guest_type text, qr_code text, checked_in boolean)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT s.seat_number,s.guest_name,s.guest_type,s.qr_code,s.checked_in
  FROM public.attendee_seats s
  WHERE s.attendee_id=p_attendee_id
  ORDER BY s.seat_number;
$$;
GRANT EXECUTE ON FUNCTION public.get_attendee_seats(uuid) TO authenticated;

-- Check-in independiente por QR. Primero busca QR por cupo; mantiene compatibilidad con QR titular.
CREATE OR REPLACE FUNCTION public.check_in_attendee(p_qr_code text)
RETURNS TABLE(
  id uuid, full_name text, qr_code text, checked_in boolean, checkin_at timestamptz,
  circle_name text, table_name text, table_number integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s record; a record;
BEGIN
  SELECT * INTO s FROM public.attendee_seats WHERE attendee_seats.qr_code=BTRIM(p_qr_code) LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Código no encontrado.'; END IF;
  IF s.checked_in THEN RAISE EXCEPTION 'Este asistente ya registró su ingreso.'; END IF;

  UPDATE public.attendee_seats SET checked_in=true,checkin_at=now() WHERE attendee_seats.id=s.id;
  SELECT at.*,c.name AS c_name,t.name AS t_name,t.table_number AS t_number
  INTO a FROM public.attendees at
  LEFT JOIN public.circles c ON c.id=at.circle_id
  LEFT JOIN public.gala_tables t ON t.id=at.table_id
  WHERE at.id=s.attendee_id;

  -- Solo marcamos el registro principal checked_in al ingresar el titular (cupo 1).
  IF s.seat_number=1 THEN
    UPDATE public.attendees SET checked_in=true,checkin_at=now() WHERE attendees.id=s.attendee_id;
  END IF;

  RETURN QUERY SELECT a.id,s.guest_name,s.qr_code,true,now(),a.c_name,a.t_name,a.t_number;
END;$$;
GRANT EXECUTE ON FUNCTION public.check_in_attendee(text) TO authenticated;

COMMIT;

SELECT a.full_name,a.seats_reserved,s.seat_number,s.guest_name,s.guest_type,s.qr_code
FROM public.attendees a
JOIN public.attendee_seats s ON s.attendee_id=a.id
ORDER BY a.full_name,s.seat_number;