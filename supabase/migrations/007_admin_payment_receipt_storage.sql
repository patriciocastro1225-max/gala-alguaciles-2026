-- Ejecutar en Supabase SQL Editor. No modifica pagos existentes.
-- Habilita carga de comprobantes administrativos solo para perfiles administradores activos.
-- Verifique antes que su usuario administrador tenga role='administrador' en public.profiles.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('payment-receipts','payment-receipts',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do nothing;

drop policy if exists "gala_admin_upload_payment_receipts" on storage.objects;
create policy "gala_admin_upload_payment_receipts"
on storage.objects for insert to authenticated
with check (
 bucket_id='payment-receipts'
 and (storage.foldername(name))[1]='admin'
 and lower(coalesce(auth.jwt()->>'email','')) <> 'pcastro@brastore.cl'
 and exists(
  select 1 from public.profiles p
  where p.id=auth.uid() and p.active=true and p.role='administrador'
 )
);

drop policy if exists "gala_admin_read_payment_receipts" on storage.objects;
create policy "gala_admin_read_payment_receipts"
on storage.objects for select to authenticated
using (
 bucket_id='payment-receipts'
 and lower(coalesce(auth.jwt()->>'email','')) <> 'pcastro@brastore.cl'
 and exists(
  select 1 from public.profiles p
  where p.id=auth.uid() and p.active=true and p.role='administrador'
 )
);

drop policy if exists "gala_admin_delete_payment_receipts" on storage.objects;
create policy "gala_admin_delete_payment_receipts"
on storage.objects for delete to authenticated
using (
 bucket_id='payment-receipts'
 and (storage.foldername(name))[1]='admin'
 and lower(coalesce(auth.jwt()->>'email','')) <> 'pcastro@brastore.cl'
 and exists(
  select 1 from public.profiles p
  where p.id=auth.uid() and p.active=true and p.role='administrador'
 )
);
commit;
