begin;
-- El archivo y los cupos se guardan en la misma transacción.
create table if not exists public.evento_comprobantes (
 evento uuid not null references public.eventos,
 grupo uuid not null,
 mime text not null,
 archivo bytea not null check(octet_length(archivo) between 1 and 5242880),
 primary key(evento,grupo)
);
alter table public.evento_comprobantes enable row level security;
revoke all on public.evento_comprobantes from public,anon,authenticated;
grant select on public.evento_comprobantes to authenticated;
drop policy if exists leer_comprobante on public.evento_comprobantes;
create policy leer_comprobante on public.evento_comprobantes for select to authenticated using(public.admin_eventos());
revoke execute on function public.inscribir_evento(uuid,uuid,jsonb),public.inscribir_evento_contacto(uuid,uuid,jsonb) from public,anon,authenticated;
create or replace function public.inscribir_evento_con_pago(clave uuid,solicitud uuid,personas jsonb,mime text,contenido text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare datos bytea;
begin
 if contenido is null or length(contenido) not between 4 and 6990508 then raise exception 'Adjunte un comprobante de hasta 5 MB'; end if;
 datos:=decode(contenido,'base64');
 if not coalesce(case mime
 when 'application/pdf' then substring(datos from 1 for 5)=decode('255044462d','hex')
 when 'image/png' then substring(datos from 1 for 8)=decode('89504e470d0a1a0a','hex')
 when 'image/jpeg' then substring(datos from 1 for 3)=decode('ffd8ff','hex')
 else false end,false) or octet_length(datos)>5242880 then raise exception 'El comprobante debe ser PDF, JPG o PNG de hasta 5 MB'; end if;
 perform public.inscribir_evento(clave,solicitud,personas);
 insert into public.evento_comprobantes values(clave,solicitud,mime,datos) on conflict(evento,grupo) do nothing;
end $$;
revoke all on function public.inscribir_evento_con_pago(uuid,uuid,jsonb,text,text) from public;
grant execute on function public.inscribir_evento_con_pago(uuid,uuid,jsonb,text,text) to anon,authenticated;
commit;
