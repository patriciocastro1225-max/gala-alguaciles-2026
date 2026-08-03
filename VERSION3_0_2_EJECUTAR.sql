begin;
create sequence if not exists public.attendee_registration_seq start 1;
alter table public.attendees add column if not exists registration_code text unique;
alter table public.attendees add column if not exists portal_token uuid default gen_random_uuid() unique;
alter table public.attendees add column if not exists validation_status text not null default 'Pendiente';
alter table public.attendees add column if not exists registration_source text default 'Panel';
alter table public.attendees add column if not exists submitted_at timestamptz default now();
create table if not exists public.attendee_timeline(id uuid primary key default gen_random_uuid(), attendee_id uuid not null references public.attendees(id) on delete cascade, title text not null, description text, created_at timestamptz not null default now());
alter table public.attendee_timeline enable row level security;
drop policy if exists "timeline_authenticated_all" on public.attendee_timeline;
create policy "timeline_authenticated_all" on public.attendee_timeline for all to authenticated using (true) with check (true);
create or replace function public.register_gala_attendee(p_full_name text,p_email text,p_phone text,p_circle_name text default null,p_attendance_status text default 'Pendiente',p_companion_name text default null,p_dietary_notes text default null,p_payment_status text default 'Pendiente',p_notes text default null)
returns table(attendee_id uuid,registration_code text,portal_token uuid,qr_code text)
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_code text; v_token uuid; v_circle uuid;
begin
 if btrim(coalesce(p_full_name,''))='' or btrim(coalesce(p_email,''))='' then raise exception 'Nombre y correo son obligatorios.'; end if;
 if exists(select 1 from public.attendees where lower(email)=lower(btrim(p_email)) and attendance_status<>'Cancelado') then raise exception 'Ya existe una inscripción activa con este correo.'; end if;
 v_code:='ALG-2026-'||lpad(nextval('public.attendee_registration_seq')::text,5,'0'); v_token:=gen_random_uuid();
 if btrim(coalesce(p_circle_name,''))<>'' then select id into v_circle from public.circles where lower(name)=lower(btrim(p_circle_name)) limit 1; end if;
 insert into public.attendees(full_name,email,phone,circle_id,attendance_status,companion_name,dietary_notes,payment_status,notes,checked_in,qr_code,registration_code,portal_token,validation_status,registration_source,submitted_at)
 values(btrim(p_full_name),lower(btrim(p_email)),nullif(btrim(coalesce(p_phone,'')),''),v_circle,p_attendance_status,nullif(btrim(coalesce(p_companion_name,'')),''),nullif(btrim(coalesce(p_dietary_notes,'')),''),p_payment_status,nullif(btrim(coalesce(p_notes,'')),''),false,v_code,v_code,v_token,'Pendiente','Portal Web',now()) returning id into v_id;
 insert into public.attendee_timeline(attendee_id,title,description) values(v_id,'Inscripción recibida','Formulario completado desde el Portal Oficial.');
 return query select v_id,v_code,v_token,v_code;
end;$$;
grant execute on function public.register_gala_attendee(text,text,text,text,text,text,text,text,text) to anon,authenticated;
create or replace function public.get_guest_portal(p_registration_code text,p_portal_token uuid) returns jsonb language sql security definer set search_path=public as $$
select jsonb_build_object('full_name',a.full_name,'registration_code',a.registration_code,'validation_status',a.validation_status,'attendance_status',a.attendance_status,'payment_status',a.payment_status,'companion_name',a.companion_name,'qr_code',a.qr_code,'circle',c.name,'table_name',t.name,'table_number',t.table_number,'timeline',coalesce((select jsonb_agg(jsonb_build_object('title',tl.title,'description',tl.description,'created_at',tl.created_at) order by tl.created_at) from public.attendee_timeline tl where tl.attendee_id=a.id),'[]'::jsonb)) from public.attendees a left join public.circles c on c.id=a.circle_id left join public.gala_tables t on t.id=a.table_id where a.registration_code=btrim(p_registration_code) and a.portal_token=p_portal_token;$$;
grant execute on function public.get_guest_portal(text,uuid) to anon,authenticated;
commit;
