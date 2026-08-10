-- ================================================================
-- VERSIÓN 3.0.2.8 — CORRECCIÓN RLS STORAGE COMPROBANTES
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- Es seguro volver a ejecutarlo.
-- ================================================================

begin;

-- La inscripción pública puede ejecutarse tanto sin sesión (anon)
-- como desde un navegador que conserve una sesión administrativa
-- (authenticated). En ambos casos SOLO se permite INSERT en la carpeta
-- pending/ del bucket privado payment-receipts.

drop policy if exists "public upload payment receipts" on storage.objects;
drop policy if exists "registration upload payment receipts" on storage.objects;

create policy "registration upload payment receipts"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'payment-receipts'
  and name like 'pending/%'
);

-- Conservamos lectura privada para el panel autenticado.
drop policy if exists "authenticated read payment receipts" on storage.objects;
create policy "authenticated read payment receipts"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-receipts');

-- Conservamos eliminación solo para usuarios autenticados.
drop policy if exists "authenticated manage payment receipts" on storage.objects;
create policy "authenticated manage payment receipts"
on storage.objects
for delete
to authenticated
using (bucket_id = 'payment-receipts');

commit;

-- VERIFICACIÓN: deben aparecer las políticas del bucket payment-receipts.
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'registration upload payment receipts',
    'authenticated read payment receipts',
    'authenticated manage payment receipts'
  )
order by policyname;
