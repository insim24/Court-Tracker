-- Stage 1: core "cases" table for the court case tracker.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
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

create index if not exists cases_user_id_idx on public.cases (user_id);
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

-- Row Level Security: each user can only see and manage their own cases.
alter table public.cases enable row level security;

create policy "Users can view their own cases"
  on public.cases for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cases"
  on public.cases for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cases"
  on public.cases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own cases"
  on public.cases for delete
  using (auth.uid() = user_id);
