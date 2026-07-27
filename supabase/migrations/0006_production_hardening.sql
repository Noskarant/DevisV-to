-- DevisVéto — durcissement production et index de suivi

-- Une adresse email ne doit correspondre qu'à un seul espace client,
-- indépendamment de la casse utilisée lors de la saisie.
create unique index if not exists profiles_email_ci_unique
  on profiles (lower(email));

-- Index adaptés aux pages de dossier animal, timelines et facturation.
create index if not exists pets_user_active_created_idx
  on pets (user_id, created_at desc)
  where archived_at is null;

create index if not exists cases_pet_created_idx
  on cases (pet_id, created_at desc)
  where pet_id is not null;

create index if not exists cases_user_created_idx
  on cases (user_id, created_at desc);

create index if not exists payments_user_created_idx
  on payments (user_id, created_at desc);

create index if not exists case_reports_case_version_idx
  on case_reports (case_id, version desc);

-- Évite qu'une fonction SECURITY DEFINER résolve des objets dans un schéma
-- contrôlé par un utilisateur.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated, service_role;

-- Les RPC de crédits sont exclusivement appelées côté serveur avec la clé
-- service role. Les grants sont répétés ici pour sécuriser les installations
-- fraîches comme les bases déjà migrées.
revoke all on function get_analysis_credit_balance(uuid) from public, anon, authenticated;
revoke all on function grant_monthly_analysis_credit(uuid, uuid, text) from public, anon, authenticated;
revoke all on function consume_analysis_credit(uuid, uuid) from public, anon, authenticated;

grant execute on function get_analysis_credit_balance(uuid) to service_role;
grant execute on function grant_monthly_analysis_credit(uuid, uuid, text) to service_role;
grant execute on function consume_analysis_credit(uuid, uuid) to service_role;

-- Les événements de facturation restent invisibles aux utilisateurs, mais
-- consultables par les administrateurs depuis les outils internes.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_events'
      and policyname = 'billing_events_select_admin'
  ) then
    create policy "billing_events_select_admin" on billing_events
      for select using (is_admin());
  end if;
end
$$;
