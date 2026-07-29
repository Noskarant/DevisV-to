alter table public.extracted_items
  add column if not exists source_page integer,
  add column if not exists source_quote text,
  add column if not exists explicit_elements jsonb not null default '[]'::jsonb,
  add column if not exists elements_to_confirm jsonb not null default '[]'::jsonb,
  add column if not exists suggested_question text,
  add column if not exists reading_status text not null default 'uncertain',
  add column if not exists quantity numeric,
  add column if not exists unit_price numeric;

alter table public.case_reports
  add column if not exists document_checks jsonb not null default '[]'::jsonb,
  add column if not exists priority_questions jsonb not null default '[]'::jsonb,
  add column if not exists generated_email_subject text,
  add column if not exists generated_email_body text,
  add column if not exists document_readability text not null default 'usable',
  add column if not exists source_page_count integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'extracted_items_reading_status_check'
  ) then
    alter table public.extracted_items
      add constraint extracted_items_reading_status_check
      check (reading_status in ('clear', 'uncertain', 'missing', 'possibly_included'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'case_reports_document_readability_check'
  ) then
    alter table public.case_reports
      add constraint case_reports_document_readability_check
      check (document_readability in ('usable', 'partial', 'insufficient'));
  end if;
end $$;

create index if not exists extracted_items_case_source_page_idx
  on public.extracted_items (case_id, source_page);
