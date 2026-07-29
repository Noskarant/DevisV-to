alter table public.cases add column if not exists document_title text;

update public.cases c
set document_title = coalesce(
  (
    select nullif(btrim(cr.amount_composition ->> 'intervention'), '')
    from public.case_reports cr
    where cr.case_id = c.id
    order by cr.version desc, cr.created_at desc
    limit 1
  ),
  (
    select nullif(btrim(regexp_replace(cd.original_filename, '\.[^.]+$', '', 'i')), '')
    from public.case_documents cd
    where cd.case_id = c.id
    order by cd.created_at desc
    limit 1
  ),
  case when c.document_type = 'facture' then 'Facture vétérinaire' else 'Devis vétérinaire' end
)
where c.document_title is null or btrim(c.document_title) = '';

create index if not exists cases_user_pet_created_idx
  on public.cases (user_id, pet_id, created_at desc);

comment on column public.cases.document_title is
  'Titre court et lisible du devis ou de la facture, affiché dans les historiques.';
