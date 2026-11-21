-- CIERRE DEFINITIVO DE INSCRIPCIONES PÚBLICAS - GRAN GALA 2026
-- No modifica asistentes, pagos, QR ni reservas existentes.
-- Ejecutar una vez en Supabase SQL Editor.
BEGIN;
CREATE OR REPLACE FUNCTION public.register_gala_attendee(
  p_full_name text,
  p_email text,
  p_phone text,
  p_circle_name text DEFAULT NULL,
  p_attendance_status text DEFAULT 'Pendiente',
  p_companion_name text DEFAULT NULL,
  p_dietary_notes text DEFAULT NULL,
  p_payment_status text DEFAULT 'Pendiente',
  p_notes text DEFAULT NULL,
  p_seats_reserved integer DEFAULT 1
)
RETURNS TABLE(attendee_id uuid, registration_code text, portal_token uuid, qr_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
  RAISE EXCEPTION 'EVENTO COMPLETO. LAS INSCRIPCIONES SE ENCUENTRAN CERRADAS.';
END;
$$;
-- Evita nuevas altas desde la RPC, incluso usando versiones antiguas del formulario.
-- La administración de asistentes existentes y la gestión de pagos permanecen disponibles.
COMMIT;
