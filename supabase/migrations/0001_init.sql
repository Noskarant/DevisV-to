-- DevisVéto — schéma initial

create extension if not exists "pgcrypto";

create type user_role as enum ('user', 'admin');
create type species_type as enum ('chien', 'chat', 'autre');
create type sex_type as enum ('male', 'femelle', 'inconnu');
create type document_type as enum ('devis', 'facture');
create type case_type as enum ('devis_upload', 'budget_prealable');
create type case_status as enum (
  'draft', 'uploaded', 'extraction_pending', 'extracted',
  'payment_pending', 'paid', 'review_pending', 'needs_information',
  'approved', 'delivered', 'error', 'refunded'
);
create type product_type as enum ('single', 'pack3', 'annual');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type extraction_status as enum ('pending', 'processing', 'done', 'error');
create type confidence_level as enum ('high', 'medium', 'low');

-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- pets
create table pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  species species_type not null,
  breed text,
  birth_date date,
  approximate_age text,
  weight_kg numeric(5,2),
  sex sex_type default 'inconnu',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- cases
create table cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid references pets(id) on delete set null,
  case_type case_type not null default 'devis_upload',
  document_type document_type,
  status case_status not null default 'draft',
  emergency_context boolean default false,
  user_description text,
  primary_question text,
  location_department text,
  document_date date,
  detected_total_amount numeric(10,2),
  currency text default 'EUR',
  payment_status payment_status default 'pending',
  product_type product_type,
  consent_data_processing boolean not null default false,
  consent_anonymized_statistics boolean not null default false,
  consent_anonymized_content boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

-- case_documents
create table case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size integer not null,
  page_count integer,
  extraction_status extraction_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- extracted_items
create table extracted_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  original_label text not null,
  normalized_label text,
  category text,
  quantity numeric(8,2),
  unit_price numeric(10,2),
  total_price numeric(10,2),
  explanation text,
  confidence_score confidence_level default 'medium',
  clarification_needed text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- case_reports
create table case_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  summary text,
  amount_composition jsonb,
  price_variation_factors jsonb,
  questions_to_ask jsonb,
  limitations text,
  ai_raw_output jsonb,
  reviewer_id uuid references profiles(id),
  reviewed_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  case_id uuid references cases(id) on delete set null,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  product_type product_type not null,
  amount integer not null,
  currency text not null default 'eur',
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- case_feedback
create table case_feedback (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  clarity_rating integer check (clarity_rating between 1 and 5),
  useful_questions boolean,
  would_pay_again boolean,
  factual_error_reported boolean default false,
  factual_error_description text,
  free_comment text,
  created_at timestamptz not null default now()
);

-- audit_logs
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  case_id uuid references cases(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- analytics_events
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  case_id uuid references cases(id) on delete set null,
  event_name text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index on cases (user_id);
create index on cases (status);
create index on extracted_items (case_id);
create index on case_documents (case_id);
create index on payments (case_id);
create index on analytics_events (event_name);
