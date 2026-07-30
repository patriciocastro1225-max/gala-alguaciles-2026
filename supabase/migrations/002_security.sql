alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.gala_tables enable row level security;
alter table public.attendees enable row level security;
alter table public.special_guests enable row level security;
alter table public.payments enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "authenticated circles" on public.circles;
create policy "authenticated circles" on public.circles
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated tables" on public.gala_tables;
create policy "authenticated tables" on public.gala_tables
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated attendees" on public.attendees;
create policy "authenticated attendees" on public.attendees
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated guests" on public.special_guests;
create policy "authenticated guests" on public.special_guests
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated payments" on public.payments;
create policy "authenticated payments" on public.payments
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated campaigns" on public.email_campaigns;
create policy "authenticated campaigns" on public.email_campaigns
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated audit read" on public.audit_log;
create policy "authenticated audit read" on public.audit_log
for select to authenticated using (true);

drop policy if exists "authenticated audit insert" on public.audit_log;
create policy "authenticated audit insert" on public.audit_log
for insert to authenticated with check (user_id = auth.uid() or user_id is null);
