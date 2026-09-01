-- II Gran Gala Nacional de los Alguaciles de Chile 2026
-- Deja visibles/confirmados estos Círculos en la portada.

BEGIN;

-- Asegura que exista 60 Comisaria Metro.
INSERT INTO public.circles (name, confirmed)
SELECT '60 COMISARIA METRO', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.circles
  WHERE upper(trim(name)) = upper(trim('60 COMISARIA METRO'))
);

-- Enciende las tres luces solicitadas.
UPDATE public.circles
SET confirmed = TRUE
WHERE upper(trim(name)) IN (
  upper(trim('40A. COMISARIA CONTROL DE ORDEN PUBLICO')),
  upper(trim('PREFECTURA RADIOPATRULLAS E INTERVENCION POLICIAL ESTE-OESTE')),
  upper(trim('60 COMISARIA METRO'))
);

COMMIT;

SELECT name, confirmed
FROM public.circles
WHERE upper(trim(name)) IN (
  upper(trim('40A. COMISARIA CONTROL DE ORDEN PUBLICO')),
  upper(trim('PREFECTURA RADIOPATRULLAS E INTERVENCION POLICIAL ESTE-OESTE')),
  upper(trim('60 COMISARIA METRO'))
)
ORDER BY name;
