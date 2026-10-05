-- Back up the database before applying. Deploy the migration before the new client.
create table if not exists public.attendance_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  status text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);
-- Older installations may have a CHECK that disallows UNMARKED. Replace status-only checks.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'public.attendance_records'::regclass and contype = 'c'
      and conkey = array[(select attnum from pg_attribute where attrelid = 'public.attendance_records'::regclass and attname = 'status')]::smallint[]
  loop
    execute format('alter table public.attendance_records drop constraint %I', constraint_name);
  end loop;
end $$;
alter table public.attendance_records add constraint attendance_records_status_check
  check (status in ('UNMARKED', 'PRESENT', 'ABSENT', 'CANCELLED'));
create unique index if not exists attendance_records_owner_session
  on public.attendance_records (user_id, session_id);
alter table public.attendance_records enable row level security;
drop policy if exists attendance_owner_access on public.attendance_records;
create policy attendance_owner_access on public.attendance_records to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Restrictive ownership protects installations that already have broader permissive policies.
drop policy if exists attendance_owner_guard on public.attendance_records;
create policy attendance_owner_guard on public.attendance_records as restrictive to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.attendance_records from anon;
grant select, insert, update on public.attendance_records to authenticated;
revoke delete on public.attendance_records from authenticated;

-- A delayed offline request must not overwrite a newer edit or clear.
create or replace function public.keep_newest_attendance_record()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.updated_at <= old.updated_at then return old; end if;
  return new;
end;
$$;
drop trigger if exists attendance_keep_newest on public.attendance_records;
create trigger attendance_keep_newest before update on public.attendance_records
for each row execute function public.keep_newest_attendance_record();
