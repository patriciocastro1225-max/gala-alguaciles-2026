-- ================================================================
-- VERSION 3.0.3.3 — CORRECCION ESTADO COMPROBANTE DE TRANSFERENCIA
-- Ejecutar en Supabase > SQL Editor > New query > Run
--
-- Problema corregido:
-- Al subir un comprobante, la cronologia indicaba que estaba recibido
-- y pendiente de validacion, pero attendees.payment_status seguia en
-- 'Pendiente'. Por eso el Portal Personal mostraba PENDIENTE DE PAGO
-- y pedia pagar nuevamente.
-- ================================================================

begin;

-- 1) Corrige inscripciones existentes que ya tienen un comprobante
-- pendiente de revision por el comite.
update public.attendees a
set payment_status = 'Pendiente de validación'
where exists (
  select 1
  from public.payments p
  where p.attendee_id = a.id
    and p.method = 'Transferencia'
    and p.validation_status = 'Pendiente'
    and p.receipt_path is not null
    and btrim(p.receipt_path) <> ''
)
and a.payment_status not in ('Pagado', 'Validado', 'Invitación');

-- 2) Corrige la funcion para todas las cargas futuras.
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

  -- Estado publico correcto mientras administracion revisa el comprobante.
  update public.attendees
  set payment_status = 'Pendiente de validación'
  where id = p_attendee_id;

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

-- VERIFICACION: los asistentes con comprobante pendiente deben aparecer
-- como "Pendiente de validación".
select
  a.registration_code,
  a.full_name,
  a.payment_status,
  p.amount,
  p.validation_status,
  p.receipt_path
from public.attendees a
join public.payments p on p.attendee_id = a.id
where p.method = 'Transferencia'
  and p.validation_status = 'Pendiente'
  and p.receipt_path is not null
order by p.created_at desc;
