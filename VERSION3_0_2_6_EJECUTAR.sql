-- ================================================================
-- VERSIÓN 3.0.2.6 — COMPROBANTES DE TRANSFERENCIA
-- Ejecutar una sola vez en Supabase > SQL Editor > New query > Run
-- Es idempotente y puede volver a ejecutarse.
-- ================================================================

begin;

alter table public.payments add column if not exists receipt_path text;
alter table public.payments add column if not exists receipt_original_name text;
alter table public.payments add column if not exists validation_status text;

alter table public.payments drop constraint if exists payments_validation_status_check;
alter table public.payments add constraint payments_validation_status_check
  check (validation_status is null or validation_status in ('Pendiente','Validado','Rechazado'));

-- Bucket privado para comprobantes. Máximo 5 MB; solo PDF/JPG/PNG.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- El formulario público solo puede SUBIR archivos al bucket privado.
-- No puede leer, listar, borrar ni modificar comprobantes existentes.
drop policy if exists "public upload payment receipts" on storage.objects;
create policy "public upload payment receipts"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'payment-receipts'
  and name like 'pending/%'
);

-- Los usuarios autenticados del panel pueden visualizar comprobantes.
drop policy if exists "authenticated read payment receipts" on storage.objects;
create policy "authenticated read payment receipts"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-receipts');

-- Permite que el panel gestione archivos si fuese necesario posteriormente.
drop policy if exists "authenticated manage payment receipts" on storage.objects;
create policy "authenticated manage payment receipts"
on storage.objects
for delete
to authenticated
using (bucket_id = 'payment-receipts');

-- Registra el comprobante únicamente si el token privado corresponde al asistente.
create or replace function public.register_payment_receipt(
  p_attendee_id uuid,
  p_portal_token uuid,
  p_receipt_path text,
  p_original_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
begin
  if not exists (
    select 1
    from public.attendees
    where id = p_attendee_id
      and portal_token = p_portal_token
  ) then
    raise exception 'INSCRIPCIÓN O TOKEN NO VÁLIDO.';
  end if;

  if p_receipt_path not like ('pending/' || p_attendee_id::text || '/%') then
    raise exception 'RUTA DE COMPROBANTE NO VÁLIDA.';
  end if;

  select id into v_payment_id
  from public.payments
  where attendee_id = p_attendee_id
    and method = 'Transferencia'
    and validation_status = 'Pendiente'
  order by created_at desc
  limit 1;

  if v_payment_id is null then
    insert into public.payments (
      attendee_id,
      amount,
      method,
      status,
      payment_date,
      reference,
      receipt_path,
      receipt_original_name,
      validation_status
    ) values (
      p_attendee_id,
      0,
      'Transferencia',
      'Pendiente',
      null,
      'COMPROBANTE WEB',
      p_receipt_path,
      p_original_name,
      'Pendiente'
    ) returning id into v_payment_id;
  else
    update public.payments
    set receipt_path = p_receipt_path,
        receipt_original_name = p_original_name,
        validation_status = 'Pendiente',
        status = 'Pendiente',
        reference = 'COMPROBANTE WEB'
    where id = v_payment_id;
  end if;

  update public.attendees
  set payment_status = 'Pendiente'
  where id = p_attendee_id;

  insert into public.attendee_timeline(attendee_id,event_type,title,description)
  values (
    p_attendee_id,
    'PAYMENT_RECEIPT',
    'Comprobante de transferencia recibido',
    'El comprobante fue cargado correctamente y quedó pendiente de validación.'
  );

  return v_payment_id;
end;
$$;

grant execute on function public.register_payment_receipt(uuid,uuid,text,text) to anon, authenticated;

commit;

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'payments'
  and column_name in ('receipt_path','receipt_original_name','validation_status')
order by column_name;
