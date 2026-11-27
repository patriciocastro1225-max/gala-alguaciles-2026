begin;
alter table public.evento_inscritos add column if not exists telefono text, add column if not exists email text;
create or replace function public.inscribir_evento(clave uuid, solicitud uuid, personas jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.eventos; usados integer; p jsonb; tipo text; numero text; rut text; suma int; i int;
begin
 select * into strict e from public.eventos where id=clave for update;
 if exists(select from public.evento_inscritos where evento=clave and grupo=solicitud) then return; end if;
 if not e.abierto then raise exception 'Inscripciones cerradas'; end if;
 if jsonb_typeof(personas) is distinct from 'array' or jsonb_array_length(personas)<>e.integrantes then raise exception 'Revise la cantidad de integrantes'; end if;
 select case when e.unidad='equipos' then count(distinct grupo) else count(*) end into usados from public.evento_inscritos where evento=clave;
 if usados+(case when e.unidad='equipos' then 1 else e.integrantes end)>e.limite then raise exception 'Cupos agotados'; end if;
 for p in select value from jsonb_array_elements(personas) loop
  if length(trim(coalesce(p->>'telefono',''))) not between 7 and 32 or trim(p->>'telefono') !~ '^[+0-9() .-]+$' or length(regexp_replace(p->>'telefono','[^0-9]','','g')) not between 7 and 15 then raise exception 'Revise el teléfono del asistente'; end if;
  if length(trim(coalesce(p->>'email',''))) not between 3 and 254 or trim(p->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Revise el correo electrónico del asistente'; end if;
  tipo:=nullif(p->>'tipo',''); numero:=nullif(trim(p->>'documento'),'');
  if coalesce(length(trim(p->>'nombre')),0) not between 1 and 160 then raise exception 'Nombre inválido'; end if;
  if e.documento='omitido' then tipo:=null; numero:=null;
  elsif numero is null then
   if e.documento='obligatorio' then raise exception 'Falta un documento'; end if;
   tipo:=null;
  elsif tipo is null or not(tipo=any(e.tipos)) or length(numero)>60 then raise exception 'Documento inválido';
  elsif tipo='RUT' then
   rut:=upper(regexp_replace(numero,'[. -]','','g'));
   if rut !~ '^[0-9]{1,8}[0-9K]$' then raise exception 'RUT inválido'; end if;
   suma:=0;
   for i in 1..length(rut)-1 loop suma:=suma+substr(rut,length(rut)-i,1)::int*(2+(i-1)%6); end loop;
   if right(rut,1)<>substr('0123456789K',1+(11-suma%11)%11,1) then raise exception 'Dígito verificador inválido'; end if;
  end if;
  insert into public.evento_inscritos(evento,grupo,nombre,tipo,documento,telefono,email) values(clave,solicitud,trim(p->>'nombre'),tipo,numero,trim(p->>'telefono'),trim(p->>'email'));
 end loop;
end $$;
create or replace function public.inscribir_evento_contacto(clave uuid, solicitud uuid, personas jsonb) returns void language sql security invoker set search_path=public,pg_temp as $$
 select public.inscribir_evento(clave,solicitud,personas);
$$;
revoke all on function public.inscribir_evento_contacto(uuid,uuid,jsonb) from public;
grant execute on function public.inscribir_evento_contacto(uuid,uuid,jsonb) to anon,authenticated;
commit;
