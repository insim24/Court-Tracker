-- Fetched CAT Srinagar order documents (Daily Order + Oral/Final Order) for
-- tracked cases. Re-fetching upserts on (case_id, pdf_url) so repeated
-- fetches don't create duplicate rows as new orders get published.
create table if not exists public.case_orders (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  order_type text not null check (order_type in ('daily', 'final')),
  order_date date,
  diary_no text,
  applicant text,
  respondent text,
  pdf_url text not null,
  fetched_at timestamptz not null default now(),
  unique (case_id, pdf_url)
);

alter table public.case_orders enable row level security;

create policy "Anyone can view case orders"
  on public.case_orders for select
  using (true);

create policy "Anyone can insert case orders"
  on public.case_orders for insert
  with check (true);

create policy "Anyone can update case orders"
  on public.case_orders for update
  using (true);

create policy "Anyone can delete case orders"
  on public.case_orders for delete
  using (true);
