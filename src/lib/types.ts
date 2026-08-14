export type Case = {
  id: string;
  case_number: string | null;
  title: string;
  court: string | null;
  case_type: string | null;
  status: string;
  filed_date: string | null;
  next_hearing_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  cgat_case_type_id: number | null;
  cgat_case_no: string | null;
  cgat_case_year: string | null;
  cgat_last_synced_at: string | null;
};

export type CauselistEntryRow = {
  id: string;
  causelist_date: string;
  bench: string;
  court_no: number | null;
  judge: string | null;
  hearing_time: string | null;
  category: string | null;
  serial_no: number | null;
  case_no: string;
  is_paperless: boolean;
  tags: string[];
  parent_case_no: string | null;
  related_case_nos: string[];
  applicant: string | null;
  respondent: string | null;
  advocate_after_dash: string | null;
  raw_text: string | null;
  linked_from_serial: boolean;
  created_at: string;
};

export type WatchedAdvocate = {
  id: string;
  name: string;
  created_at: string;
};
