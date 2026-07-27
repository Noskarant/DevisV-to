-- DevisVéto — fonction administrateur privée et politiques RLS optimisées

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

-- Profils
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

-- Animaux
drop policy if exists "pets_all_own_or_admin" on public.pets;
create policy "pets_all_own_or_admin" on public.pets
  for all to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()))
  with check ((select auth.uid()) = user_id or (select private.is_admin()));

-- Dossiers
drop policy if exists "cases_select_own_or_admin" on public.cases;
drop policy if exists "cases_insert_own" on public.cases;
drop policy if exists "cases_update_own_or_admin" on public.cases;
drop policy if exists "cases_delete_own_or_admin" on public.cases;

create policy "cases_select_own_or_admin" on public.cases
  for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

create policy "cases_insert_own" on public.cases
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      pet_id is null
      or exists (
        select 1 from public.pets p
        where p.id = pet_id and p.user_id = (select auth.uid())
      )
    )
    and (
      comparison_case_id is null
      or exists (
        select 1 from public.cases compared
        where compared.id = comparison_case_id
          and compared.user_id = (select auth.uid())
      )
    )
  );

create policy "cases_update_own_or_admin" on public.cases
  for update to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()))
  with check (
    ((select auth.uid()) = user_id or (select private.is_admin()))
    and (
      pet_id is null
      or (select private.is_admin())
      or exists (
        select 1 from public.pets p
        where p.id = pet_id and p.user_id = (select auth.uid())
      )
    )
    and (
      comparison_case_id is null
      or (select private.is_admin())
      or exists (
        select 1 from public.cases compared
        where compared.id = comparison_case_id
          and compared.user_id = (select auth.uid())
      )
    )
  );

create policy "cases_delete_own_or_admin" on public.cases
  for delete to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

-- Documents
drop policy if exists "case_documents_select" on public.case_documents;
drop policy if exists "case_documents_insert" on public.case_documents;
drop policy if exists "case_documents_delete" on public.case_documents;

create policy "case_documents_select" on public.case_documents
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.cases c
      where c.id = case_id and c.user_id = (select auth.uid())
    )
  );

create policy "case_documents_insert" on public.case_documents
  for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = case_id and c.user_id = (select auth.uid())
    )
  );

create policy "case_documents_delete" on public.case_documents
  for delete to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.cases c
      where c.id = case_id and c.user_id = (select auth.uid())
    )
  );

-- Lignes extraites : lecture propriétaire, écritures administrateur
drop policy if exists "extracted_items_select" on public.extracted_items;
drop policy if exists "extracted_items_admin_write" on public.extracted_items;
drop policy if exists "extracted_items_admin_insert" on public.extracted_items;
drop policy if exists "extracted_items_admin_update" on public.extracted_items;
drop policy if exists "extracted_items_admin_delete" on public.extracted_items;

create policy "extracted_items_select" on public.extracted_items
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.cases c
      where c.id = case_id and c.user_id = (select auth.uid())
    )
  );

create policy "extracted_items_admin_insert" on public.extracted_items
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "extracted_items_admin_update" on public.extracted_items
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "extracted_items_admin_delete" on public.extracted_items
  for delete to authenticated
  using ((select private.is_admin()));

-- Rapports : lecture après livraison, écritures administrateur
drop policy if exists "case_reports_select" on public.case_reports;
drop policy if exists "case_reports_admin_write" on public.case_reports;
drop policy if exists "case_reports_admin_insert" on public.case_reports;
drop policy if exists "case_reports_admin_update" on public.case_reports;
drop policy if exists "case_reports_admin_delete" on public.case_reports;

create policy "case_reports_select" on public.case_reports
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.cases c
      where c.id = case_id
        and c.user_id = (select auth.uid())
        and c.status = 'delivered'
    )
  );

create policy "case_reports_admin_insert" on public.case_reports
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "case_reports_admin_update" on public.case_reports
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "case_reports_admin_delete" on public.case_reports
  for delete to authenticated
  using ((select private.is_admin()));

-- Paiements et retours
drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin" on public.payments
  for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

drop policy if exists "case_feedback_insert_own" on public.case_feedback;
drop policy if exists "case_feedback_select_own_or_admin" on public.case_feedback;

create policy "case_feedback_insert_own" on public.case_feedback
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cases c
      where c.id = case_id and c.user_id = (select auth.uid())
    )
  );

create policy "case_feedback_select_own_or_admin" on public.case_feedback
  for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

-- Journaux et événements
drop policy if exists "audit_logs_admin_only" on public.audit_logs;
create policy "audit_logs_admin_only" on public.audit_logs
  for select to authenticated
  using ((select private.is_admin()));

drop policy if exists "analytics_events_insert" on public.analytics_events;
drop policy if exists "analytics_events_select_admin" on public.analytics_events;

create policy "analytics_events_insert" on public.analytics_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id or user_id is null);

create policy "analytics_events_select_admin" on public.analytics_events
  for select to authenticated
  using ((select private.is_admin()));

-- Abonnements et crédits
drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

drop policy if exists "credit_ledger_select_own_or_admin" on public.analysis_credit_ledger;
create policy "credit_ledger_select_own_or_admin" on public.analysis_credit_ledger
  for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

drop policy if exists "billing_events_select_admin" on public.billing_events;
create policy "billing_events_select_admin" on public.billing_events
  for select to authenticated
  using ((select private.is_admin()));

-- Rappels et poids
drop policy if exists "pet_reminders_all_own_or_admin" on public.pet_reminders;
create policy "pet_reminders_all_own_or_admin" on public.pet_reminders
  for all to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()))
  with check (
    ((select auth.uid()) = user_id or (select private.is_admin()))
    and (
      (select private.is_admin())
      or exists (
        select 1 from public.pets p
        where p.id = pet_id and p.user_id = (select auth.uid())
      )
    )
    and (
      source_case_id is null
      or (select private.is_admin())
      or exists (
        select 1 from public.cases c
        where c.id = source_case_id and c.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "pet_weight_entries_all_own_or_admin" on public.pet_weight_entries;
create policy "pet_weight_entries_all_own_or_admin" on public.pet_weight_entries
  for all to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()))
  with check (
    ((select auth.uid()) = user_id or (select private.is_admin()))
    and (
      (select private.is_admin())
      or exists (
        select 1 from public.pets p
        where p.id = pet_id and p.user_id = (select auth.uid())
      )
    )
  );

-- Stockage privé
drop policy if exists "case_documents_storage_select" on storage.objects;
drop policy if exists "case_documents_storage_insert" on storage.objects;
drop policy if exists "case_documents_storage_delete" on storage.objects;

create policy "case_documents_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'case-documents'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );

create policy "case_documents_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "case_documents_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'case-documents'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );

-- La fonction publique n'est plus nécessaire et n'est plus exposée comme RPC.
drop function if exists public.is_admin();