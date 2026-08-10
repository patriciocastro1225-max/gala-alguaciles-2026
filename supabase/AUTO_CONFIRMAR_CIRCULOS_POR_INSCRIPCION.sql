-- Gran Gala 2026
-- Enciende automáticamente la luz de un Círculo cuando se registra
-- al menos un asistente confirmado asociado a ese Círculo.
--
-- Este script:
-- 1) Activa ahora los Círculos que ya tienen inscripciones confirmadas.
-- 2) Crea un trigger para futuras inscripciones/actualizaciones.
-- 3) No desactiva Círculos confirmados manualmente.

-- Activar Círculos correspondientes a inscripciones ya existentes.
UPDATE public.circles AS c
SET confirmed = TRUE
WHERE c.confirmed IS DISTINCT FROM TRUE
  AND EXISTS (
    SELECT 1
    FROM public.attendees AS a
    WHERE a.circle_id = c.id
      AND a.attendance_status = 'Confirmado'
  );

-- Función utilizada por el trigger.
CREATE OR REPLACE FUNCTION public.confirm_circle_from_attendee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.circle_id IS NOT NULL
     AND NEW.attendance_status = 'Confirmado' THEN
    UPDATE public.circles
    SET confirmed = TRUE
    WHERE id = NEW.circle_id
      AND confirmed IS DISTINCT FROM TRUE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_confirm_circle_from_attendee ON public.attendees;

CREATE TRIGGER trg_confirm_circle_from_attendee
AFTER INSERT OR UPDATE OF circle_id, attendance_status
ON public.attendees
FOR EACH ROW
EXECUTE FUNCTION public.confirm_circle_from_attendee();

-- Verificación: muestra los Círculos que actualmente tienen su luz encendida.
SELECT id, name, confirmed
FROM public.circles
WHERE confirmed = TRUE
ORDER BY name;
