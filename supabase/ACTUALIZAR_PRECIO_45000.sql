-- PRECIO OFICIAL II GRAN GALA NACIONAL 2026
-- Ejecutar una vez en Supabase > SQL Editor

update public.event_config
set dinner_price = 45000
where id = 1;

select id, dinner_price
from public.event_config
where id = 1;
