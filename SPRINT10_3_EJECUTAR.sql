-- SPRINT 10.3
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- Permite que la portada pública consulte los Círculos creados en el panel.

alter table public.circles enable row level security;

drop policy if exists "public circles read" on public.circles;
create policy "public circles read"
on public.circles
for select
to anon
using (true);

select
  count(*) as total_circulos,
  count(*) filter (where confirmed = true) as confirmados
from public.circles;
