insert into public.gala_tables (table_number, name, capacity, zone)
select
  n,
  case when n = 1 then 'Mesa Presidencial' else 'Mesa ' || n end,
  10,
  case when n <= 3 then 'Autoridades'
       when n <= 14 then 'Central'
       else 'General' end
from generate_series(1,22) as n
on conflict (table_number) do nothing;
