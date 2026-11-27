begin;
create table public.eventos (
 id uuid primary key default gen_random_uuid(), nombre text not null check(trim(nombre)<>''), fecha date not null,
 hora time not null, recinto text not null, direccion text not null, abierto boolean not null default false,
 limite integer not null check(limite>0), unidad text not null check(unidad in ('personas','equipos')),
 integrantes integer not null check(integrantes between 1 and 50), documento text not null check(documento in ('omitido','opcional','obligatorio')),
 tipos text[] not null check(tipos <@ array['RUT','DNI','Pasaporte'] and (documento='omitido' or cardinality(tipos)>0)),
 nombres_mesas text[] not null default '{}', mesas boolean not null default false, credenciales boolean not null default true
);
create table public.evento_inscritos (
 id uuid primary key default gen_random_uuid(), evento uuid not null references public.eventos, grupo uuid not null,
 nombre text not null, tipo text, documento text, mesa text not null default '', ingreso timestamptz
);
create index on public.evento_inscritos(evento,grupo);
create function public.admin_eventos() returns boolean language sql stable security invoker set search_path=public as $$
 select lower(coalesce(auth.jwt()->>'email','')) <> 'pcastro@brastore.cl' and exists(select from public.profiles where id=auth.uid() and active and role='administrador')
$$;
alter table public.eventos enable row level security;
alter table public.evento_inscritos enable row level security;
revoke all on public.eventos,public.evento_inscritos from public,anon,authenticated;
grant select,insert,update on public.eventos to authenticated;
grant select,update(mesa,ingreso) on public.evento_inscritos to authenticated;
create policy gestionar_eventos on public.eventos to authenticated using(public.admin_eventos()) with check(public.admin_eventos());
create policy gestionar_inscritos on public.evento_inscritos to authenticated using(public.admin_eventos()) with check(public.admin_eventos());
create function public.ficha_evento(clave uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select to_jsonb(e)||jsonb_build_object('ocupados',case when unidad='equipos' then count(distinct i.grupo) else count(i.id) end)
 from public.eventos e left join public.evento_inscritos i on i.evento=e.id where e.id=clave group by e.id
$$;
create function public.inscribir_evento(clave uuid, solicitud uuid, personas jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.eventos; usados integer; p jsonb; tipo text; numero text; rut text; suma int; i int;
begin
 select * into strict e from public.eventos where id=clave for update;
 if exists(select from public.evento_inscritos where evento=clave and grupo=solicitud) then return; end if;
 if not e.abierto then raise exception 'Inscripciones cerradas'; end if;
 if jsonb_typeof(personas) is distinct from 'array' or jsonb_array_length(personas)<>e.integrantes then raise exception 'Revise la cantidad de integrantes'; end if;
 select case when e.unidad='equipos' then count(distinct grupo) else count(*) end into usados from public.evento_inscritos where evento=clave;
 if usados+(case when e.unidad='equipos' then 1 else e.integrantes end)>e.limite then raise exception 'Cupos agotados'; end if;
 for p in select value from jsonb_array_elements(personas) loop
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
  insert into public.evento_inscritos(evento,grupo,nombre,tipo,documento) values(clave,solicitud,trim(p->>'nombre'),tipo,numero);
 end loop;
end $$;
revoke all on function public.ficha_evento(uuid),public.inscribir_evento(uuid,uuid,jsonb) from public;
grant execute on function public.ficha_evento(uuid),public.inscribir_evento(uuid,uuid,jsonb) to anon,authenticated;
commit;
