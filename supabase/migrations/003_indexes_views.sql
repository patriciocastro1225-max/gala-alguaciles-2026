create index if not exists attendees_name_idx on public.attendees using gin (to_tsvector('simple', full_name));
create index if not exists attendees_circle_idx on public.attendees(circle_id);
create index if not exists attendees_table_idx on public.attendees(table_id);
create index if not exists attendees_status_idx on public.attendees(attendance_status);
create index if not exists attendees_checkin_idx on public.attendees(checked_in);
create index if not exists payments_attendee_idx on public.payments(attendee_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists circles_name_idx on public.circles(name);

create or replace view public.dashboard_metrics as
select
  (select count(*) from public.attendees) as registered,
  (select count(*) from public.attendees where attendance_status = 'Confirmado') as confirmed,
  (select count(*) from public.attendees where checked_in) as checked_in,
  (select count(*) from public.attendees where payment_status = 'Pendiente') as payment_pending,
  (select coalesce(sum(amount),0) from public.payments where status in ('Pagado','Parcial')) as collected,
  (select count(*) from public.gala_tables) as total_tables,
  (select coalesce(sum(capacity),0) from public.gala_tables) as total_capacity,
  (select count(*) from public.attendees where table_id is not null) as assigned_seats;

create or replace view public.table_occupancy as
select
  t.id,
  t.table_number,
  t.name,
  t.capacity,
  t.zone,
  count(a.id)::integer as occupied,
  greatest(t.capacity - count(a.id), 0)::integer as available
from public.gala_tables t
left join public.attendees a on a.table_id = t.id
group by t.id, t.table_number, t.name, t.capacity, t.zone;
