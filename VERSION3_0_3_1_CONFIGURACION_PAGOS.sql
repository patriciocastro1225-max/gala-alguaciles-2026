-- ================================================================
-- VERSION 3.0.3.1 — CONFIGURACION EDITABLE DE PAGOS
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- ================================================================

begin;

alter table public.event_config add column if not exists dinner_price integer not null default 43000;
alter table public.event_config add column if not exists bank_name text;
alter table public.event_config add column if not exists bank_account_type text;
alter table public.event_config add column if not exists bank_account_number text;
alter table public.event_config add column if not exists bank_rut text;
alter table public.event_config add column if not exists bank_email text;
alter table public.event_config add column if not exists bank_account_holder text;

update public.event_config
set dinner_price = 43000
where id = 1 and (dinner_price is null or dinner_price <= 0);

-- Configuracion publica segura: solo expone los datos necesarios para pagar.
create or replace function public.get_public_payment_config()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select jsonb_build_object(
    'dinner_price', dinner_price,
    'bank_name', coalesce(bank_name,''),
    'bank_account_type', coalesce(bank_account_type,''),
    'bank_account_number', coalesce(bank_account_number,''),
    'bank_rut', coalesce(bank_rut,''),
    'bank_email', coalesce(bank_email,''),
    'bank_account_holder', coalesce(bank_account_holder,'')
  )
  from public.event_config
  where id = 1;
$$;

grant execute on function public.get_public_payment_config() to anon, authenticated;

-- Nueva variante de registro de comprobante que guarda el monto esperado.
create or replace function public.register_payment_receipt(
  p_attendee_id uuid,
  p_portal_token uuid,
  p_receipt_path text,
  p_original_name text,
  p_amount integer
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment_id uuid;
begin
  if not exists (
    select 1 from public.attendees
    where id = p_attendee_id and portal_token = p_portal_token
  ) then
    raise exception 'INSCRIPCIÓN O TOKEN NO VÁLIDO.';
  end if;

  if p_receipt_path not like ('pending/' || p_attendee_id::text || '/%') then
    raise exception 'RUTA DE COMPROBANTE NO VÁLIDA.';
  end if;

  if coalesce(p_amount,0) <= 0 then
    raise exception 'MONTO DE PAGO NO VÁLIDO.';
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
      attendee_id, amount, method, status, payment_date, reference,
      receipt_path, receipt_original_name, validation_status
    ) values (
      p_attendee_id, p_amount, 'Transferencia', 'Pendiente', null,
      'COMPROBANTE WEB', p_receipt_path, p_original_name, 'Pendiente'
    ) returning id into v_payment_id;
  else
    update public.payments
    set amount = p_amount,
        receipt_path = p_receipt_path,
        receipt_original_name = p_original_name,
        validation_status = 'Pendiente',
        status = 'Pendiente',
        reference = 'COMPROBANTE WEB'
    where id = v_payment_id;
  end if;

  update public.attendees set payment_status = 'Pendiente' where id = p_attendee_id;

  insert into public.attendee_timeline(attendee_id,event_type,title,description)
  values (
    p_attendee_id,
    'PAYMENT_RECEIPT',
    'Comprobante de transferencia recibido',
    'El comprobante fue cargado correctamente por un monto informado de $' || p_amount::text || ' y quedó pendiente de validación.'
  );

  return v_payment_id;
end;
$$;

grant execute on function public.register_payment_receipt(uuid,uuid,text,text,integer) to anon, authenticated;

commit;

select id, dinner_price, bank_name, bank_account_type, bank_account_number, bank_rut, bank_email, bank_account_holder
from public.event_config where id = 1;
