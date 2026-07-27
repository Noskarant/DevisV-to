-- DevisVéto — abonnement mensuel et dossier longitudinal par animal

alter table pets
  add column if not exists color text,
  add column if not exists identification_number text,
  add column if not exists sterilized boolean,
  add column if not exists allergies text,
  add column if not exists chronic_conditions text,
  add column if not exists current_treatments text,
  add column if not exists diet_notes text,
  add column if not exists behavior_notes text,
  add column if not exists veterinarian_name text,
  add column if not exists veterinarian_phone text,
  add column if not exists insurance_provider text,
  add column if not exists insurance_contract text,
  add column if not exists general_notes text,
  add column if not exists archived_at timestamptz;

alter table cases
  add column if not exists entitlement_source text,
  add column if not exists access_granted_at timestamptz,
  add column if not exists comparison_case_id uuid references cases(id) on delete set null;

alter table payments
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_invoice_id text;

create unique index if not exists payments_stripe_invoice_unique
  on payments(stripe_invoice_id)
  where stripe_invoice_id is not null;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null default 'incomplete' check (
    status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')
  ),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_one_live_per_user
  on subscriptions(user_id)
  where status in ('incomplete', 'trialing', 'active', 'past_due');
create index if not exists subscriptions_user_id_idx on subscriptions(user_id);
create index if not exists subscriptions_customer_idx on subscriptions(stripe_customer_id);

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete cascade,
  external_reference text not null unique,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists analysis_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  case_id uuid references cases(id) on delete set null,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('monthly_renewal', 'manual_adjustment', 'analysis_used', 'refund')),
  external_reference text unique,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_idx on analysis_credit_ledger(user_id, created_at desc);

create table if not exists pet_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete cascade,
  source_case_id uuid references cases(id) on delete set null,
  title text not null,
  due_date date not null,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pet_reminders_due_idx on pet_reminders(user_id, due_date);
create index if not exists pet_reminders_pet_idx on pet_reminders(pet_id, due_date);

create table if not exists pet_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg > 0 and weight_kg < 300),
  recorded_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists pet_weight_entries_pet_idx on pet_weight_entries(pet_id, recorded_at desc);

create or replace function get_analysis_credit_balance(p_user_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select greatest(0, coalesce(sum(delta), 0))::integer
  from analysis_credit_ledger
  where user_id = p_user_id;
$$;

create or replace function grant_monthly_analysis_credit(
  p_user_id uuid,
  p_subscription_id uuid,
  p_external_reference text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
begin
  perform 1 from profiles where id = p_user_id for update;

  insert into billing_events(user_id, subscription_id, external_reference, event_type)
  values (p_user_id, p_subscription_id, p_external_reference, 'monthly_credit')
  on conflict (external_reference) do nothing;

  if not found then
    return get_analysis_credit_balance(p_user_id);
  end if;

  current_balance := get_analysis_credit_balance(p_user_id);
  if current_balance < 3 then
    insert into analysis_credit_ledger(
      user_id, subscription_id, delta, reason, external_reference
    ) values (
      p_user_id, p_subscription_id, 1, 'monthly_renewal', p_external_reference
    );
  end if;

  return get_analysis_credit_balance(p_user_id);
end;
$$;

create or replace function consume_analysis_credit(p_user_id uuid, p_case_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
  owned_case uuid;
begin
  perform 1 from profiles where id = p_user_id for update;

  select id into owned_case
  from cases
  where id = p_case_id
    and user_id = p_user_id
    and payment_status <> 'succeeded'
  for update;

  if owned_case is null then
    return false;
  end if;

  current_balance := get_analysis_credit_balance(p_user_id);
  if current_balance < 1 then
    return false;
  end if;

  insert into analysis_credit_ledger(user_id, case_id, delta, reason, external_reference)
  values (p_user_id, p_case_id, -1, 'analysis_used', 'case:' || p_case_id::text)
  on conflict (external_reference) do nothing;

  if not found then
    return false;
  end if;

  update cases
  set status = 'paid',
      payment_status = 'succeeded',
      product_type = 'monthly',
      entitlement_source = 'subscription_credit',
      access_granted_at = now(),
      updated_at = now()
  where id = p_case_id;

  return true;
end;
$$;

alter table subscriptions enable row level security;
alter table billing_events enable row level security;
alter table analysis_credit_ledger enable row level security;
alter table pet_reminders enable row level security;
alter table pet_weight_entries enable row level security;

create policy "subscriptions_select_own_or_admin" on subscriptions
  for select using (auth.uid() = user_id or is_admin());

create policy "credit_ledger_select_own_or_admin" on analysis_credit_ledger
  for select using (auth.uid() = user_id or is_admin());

create policy "pet_reminders_all_own_or_admin" on pet_reminders
  for all using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

create policy "pet_weight_entries_all_own_or_admin" on pet_weight_entries
  for all using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

revoke all on function get_analysis_credit_balance(uuid) from public, anon, authenticated;
revoke all on function grant_monthly_analysis_credit(uuid, uuid, text) from public, anon, authenticated;
revoke all on function consume_analysis_credit(uuid, uuid) from public, anon, authenticated;
grant execute on function get_analysis_credit_balance(uuid) to service_role;
grant execute on function grant_monthly_analysis_credit(uuid, uuid, text) to service_role;
grant execute on function consume_analysis_credit(uuid, uuid) to service_role;
