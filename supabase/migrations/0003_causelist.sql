-- Cause list watcher: stores each fetched day's parsed causelist for CAT
-- Srinagar, plus a small list of advocates the user wants flagged even for
-- cases not yet in their tracker.
--
-- The source site (cis.cgat.gov.in) only ever exposes the CURRENTLY
-- published causelist (no date picker / archive), so this table is the
-- app's own growing history: each "fetch latest" call upserts that day's
-- entries, building up an archive over time.
create table if not exists public.causelist_entries (
  id uuid primary key default gen_random_uuid(),
  causelist_date date not null,
  bench text not null default 'Srinagar',
  court_no integer,
  judge text,
  hearing_time text,
  category text,
  serial_no integer,
  case_no text not null,
  is_paperless boolean not null default false,
  tags text[] not null default '{}',
  parent_case_no text,
  related_case_nos text[] not null default '{}',
  applicant text,
  respondent text,
  advocate_after_dash text,
  raw_text text,
  linked_from_serial boolean not null default false,
  created_at timestamptz not null default now(),
  unique (causelist_date, case_no)
);

create index if not exists causelist_entries_date_idx
  on public.causelist_entries (causelist_date);
create index if not exists causelist_entries_case_no_idx
  on public.causelist_entries (case_no);

alter table public.causelist_entries enable row level security;

create policy "Anyone can view causelist entries"
  on public.causelist_entries for select
  using (true);

create policy "Anyone can insert causelist entries"
  on public.causelist_entries for insert
  with check (true);

create policy "Anyone can update causelist entries"
  on public.causelist_entries for update
  using (true)
  with check (true);

create policy "Anyone can delete causelist entries"
  on public.causelist_entries for delete
  using (true);

-- Advocates to flag even for cases not yet in the user's tracker.
create table if not exists public.watched_advocates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.watched_advocates enable row level security;

create policy "Anyone can view watched advocates"
  on public.watched_advocates for select
  using (true);

create policy "Anyone can insert watched advocates"
  on public.watched_advocates for insert
  with check (true);

create policy "Anyone can delete watched advocates"
  on public.watched_advocates for delete
  using (true);

insert into public.watched_advocates (name)
values ('Syed Mohtasim'), ('Syed Manzoor')
on conflict (name) do nothing;
