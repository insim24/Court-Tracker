-- Links a case row to its CGAT Srinagar identity so it can be refreshed
-- (status / next hearing date) from the tribunal's own case-status search.
alter table public.cases
  add column if not exists cgat_case_type_id smallint,
  add column if not exists cgat_case_no text,
  add column if not exists cgat_case_year text,
  add column if not exists cgat_last_synced_at timestamptz;
