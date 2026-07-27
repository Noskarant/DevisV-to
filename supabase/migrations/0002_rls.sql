-- RLS

alter table profiles enable row level security;
alter table pets enable row level security;
alter table cases enable row level security;
alter table case_documents enable row level security;
alter table extracted_items enable row level security;
alter table case_reports enable row level security;
alter table payments enable row level security;
alter table case_feedback enable row level security;
alter table audit_logs enable row level security;
alter table analytics_events enable row level security;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- pets
create policy "pets_all_own_or_admin" on pets
  for all using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

-- cases
create policy "cases_select_own_or_admin" on cases
  for select using (auth.uid() = user_id or is_admin());
create policy "cases_insert_own" on cases
  for insert with check (auth.uid() = user_id);
create policy "cases_update_own_or_admin" on cases
  for update using (auth.uid() = user_id or is_admin());
create policy "cases_delete_own_or_admin" on cases
  for delete using (auth.uid() = user_id or is_admin());

-- case_documents (private; access checked via parent case ownership)
create policy "case_documents_select" on case_documents
  for select using (
    is_admin() or exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid())
  );
create policy "case_documents_insert" on case_documents
  for insert with check (
    exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid())
  );
create policy "case_documents_delete" on case_documents
  for delete using (
    is_admin() or exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid())
  );

-- extracted_items: user read-only, admin full
create policy "extracted_items_select" on extracted_items
  for select using (
    is_admin() or exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid())
  );
create policy "extracted_items_admin_write" on extracted_items
  for all using (is_admin()) with check (is_admin());

-- case_reports: user read-only (delivered only), admin full
create policy "case_reports_select" on case_reports
  for select using (
    is_admin() or exists (
      select 1 from cases c where c.id = case_id and c.user_id = auth.uid() and c.status = 'delivered'
    )
  );
create policy "case_reports_admin_write" on case_reports
  for all using (is_admin()) with check (is_admin());

-- payments: server-side only (no direct client write); user can read own
create policy "payments_select_own_or_admin" on payments
  for select using (auth.uid() = user_id or is_admin());

-- case_feedback
create policy "case_feedback_insert_own" on case_feedback
  for insert with check (auth.uid() = user_id);
create policy "case_feedback_select_own_or_admin" on case_feedback
  for select using (auth.uid() = user_id or is_admin());

-- audit_logs: admin only
create policy "audit_logs_admin_only" on audit_logs
  for select using (is_admin());

-- analytics_events: insert by anyone authenticated for own user_id, admin read
create policy "analytics_events_insert" on analytics_events
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "analytics_events_select_admin" on analytics_events
  for select using (is_admin());
