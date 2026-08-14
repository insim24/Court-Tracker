-- Web Push subscriptions (one row per device/browser that's enabled
-- notifications) and a dedup log so the "case coming up soon" alert only
-- fires once per case per day, not on every poll while it's within range.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Anyone can view push subscriptions"
  on public.push_subscriptions for select
  using (true);

create policy "Anyone can insert push subscriptions"
  on public.push_subscriptions for insert
  with check (true);

create policy "Anyone can delete push subscriptions"
  on public.push_subscriptions for delete
  using (true);

create table if not exists public.display_board_alerts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  causelist_date date not null,
  court_no integer,
  target_serial integer,
  board_serial_at_alert integer,
  created_at timestamptz not null default now(),
  unique (case_id, causelist_date)
);

alter table public.display_board_alerts enable row level security;

create policy "Anyone can view display board alerts"
  on public.display_board_alerts for select
  using (true);

create policy "Anyone can insert display board alerts"
  on public.display_board_alerts for insert
  with check (true);
