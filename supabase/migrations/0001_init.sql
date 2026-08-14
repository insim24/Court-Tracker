-- Stage 1: core "cases" table for the court case tracker.
-- Single-user mode: no auth flow yet, so rows aren't scoped to a user.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text,
  title text not null,
  court text,
  case_type text,
  status text not null default 'open',
  filed_date date,
  next_hearing_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_next_hearing_date_idx on public.cases (next_hearing_date);

-- Keep updated_at current on every row change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
  before update on public.cases
  for each row
  execute function public.set_updated_at();

-- Row Level Security: enabled for good practice, but permissive since this
-- is a single-user app with no login flow yet. Tighten this (scope to
-- auth.uid()) if/when real auth is added.
alter table public.cases enable row level security;

create policy "Anyone can view cases"
  on public.cases for select
  using (true);

create policy "Anyone can insert cases"
  on public.cases for insert
  with check (true);

create policy "Anyone can update cases"
  on public.cases for update
  using (true)
  with check (true);

create policy "Anyone can delete cases"
  on public.cases for delete
  using (true);
