-- DevisVéto — garde-fous opérationnels avant mise en production

-- Crée systématiquement le profil applicatif lors de la création d'un utilisateur
-- par lien magique. Le parcours public peut ensuite faire un upsert sans conflit.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();

-- Rattrape d'éventuels utilisateurs créés avant l'installation du trigger.
insert into public.profiles (id, email, full_name)
select
  u.id,
  coalesce(u.email, ''),
  nullif(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

-- Maintient automatiquement updated_at sur les entités modifiables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'pets', 'cases', 'extracted_items', 'case_reports',
    'payments', 'subscriptions', 'pet_reminders'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end
$$;

-- Indexe toutes les clés étrangères utilisées par les suppressions en cascade,
-- les webhooks Stripe et les timelines.
create index if not exists analysis_credit_ledger_case_idx
  on analysis_credit_ledger (case_id) where case_id is not null;
create index if not exists analysis_credit_ledger_subscription_idx
  on analysis_credit_ledger (subscription_id) where subscription_id is not null;
create index if not exists analytics_events_case_idx
  on analytics_events (case_id) where case_id is not null;
create index if not exists analytics_events_user_idx
  on analytics_events (user_id) where user_id is not null;
create index if not exists audit_logs_case_idx
  on audit_logs (case_id) where case_id is not null;
create index if not exists audit_logs_user_idx
  on audit_logs (user_id) where user_id is not null;
create index if not exists billing_events_subscription_idx
  on billing_events (subscription_id) where subscription_id is not null;
create index if not exists billing_events_user_idx
  on billing_events (user_id);
create index if not exists case_feedback_case_idx
  on case_feedback (case_id);
create index if not exists case_feedback_user_idx
  on case_feedback (user_id);
create index if not exists case_reports_reviewer_idx
  on case_reports (reviewer_id) where reviewer_id is not null;
create index if not exists cases_comparison_case_idx
  on cases (comparison_case_id) where comparison_case_id is not null;
create index if not exists pet_reminders_source_case_idx
  on pet_reminders (source_case_id) where source_case_id is not null;
create index if not exists pet_weight_entries_user_idx
  on pet_weight_entries (user_id);

-- Un utilisateur ne peut rattacher un dossier, un rappel ou une pesée qu'à
-- l'un de ses propres animaux, même en appelant directement l'API Supabase.
drop policy if exists "cases_insert_own" on cases;
create policy "cases_insert_own" on cases
  for insert
  with check (
    auth.uid() = user_id
    and (
      pet_id is null
      or exists (
        select 1 from pets p
        where p.id = pet_id and p.user_id = auth.uid()
      )
    )
    and (
      comparison_case_id is null
      or exists (
        select 1 from cases compared
        where compared.id = comparison_case_id and compared.user_id = auth.uid()
      )
    )
  );

drop policy if exists "cases_update_own_or_admin" on cases;
create policy "cases_update_own_or_admin" on cases
  for update
  using (auth.uid() = user_id or is_admin())
  with check (
    (auth.uid() = user_id or is_admin())
    and (
      pet_id is null
      or is_admin()
      or exists (
        select 1 from pets p
        where p.id = pet_id and p.user_id = auth.uid()
      )
    )
    and (
      comparison_case_id is null
      or is_admin()
      or exists (
        select 1 from cases compared
        where compared.id = comparison_case_id and compared.user_id = auth.uid()
      )
    )
  );

drop policy if exists "pet_reminders_all_own_or_admin" on pet_reminders;
create policy "pet_reminders_all_own_or_admin" on pet_reminders
  for all
  using (auth.uid() = user_id or is_admin())
  with check (
    (auth.uid() = user_id or is_admin())
    and (
      is_admin()
      or exists (
        select 1 from pets p
        where p.id = pet_id and p.user_id = auth.uid()
      )
    )
    and (
      source_case_id is null
      or is_admin()
      or exists (
        select 1 from cases c
        where c.id = source_case_id and c.user_id = auth.uid()
      )
    )
  );

drop policy if exists "pet_weight_entries_all_own_or_admin" on pet_weight_entries;
create policy "pet_weight_entries_all_own_or_admin" on pet_weight_entries
  for all
  using (auth.uid() = user_id or is_admin())
  with check (
    (auth.uid() = user_id or is_admin())
    and (
      is_admin()
      or exists (
        select 1 from pets p
        where p.id = pet_id and p.user_id = auth.uid()
      )
    )
  );

drop policy if exists "case_feedback_insert_own" on case_feedback;
create policy "case_feedback_insert_own" on case_feedback
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from cases c
      where c.id = case_id and c.user_id = auth.uid()
    )
  );

-- Cette fonction interne du projet Supabase n'a pas à être invoquée via RPC
-- par des visiteurs ou des utilisateurs connectés.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and p.pronargs = 0
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;