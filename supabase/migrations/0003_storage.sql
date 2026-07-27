-- Bucket privé pour les documents de devis (créé aussi via dashboard Supabase si besoin)
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

-- Chemin de stockage attendu : {user_id}/{case_id}/{filename}
-- Un utilisateur ne peut lire/écrire que sous son propre user_id ; l'admin lit tout.

create policy "case_documents_storage_select" on storage.objects
  for select using (
    bucket_id = 'case-documents'
    and (is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

create policy "case_documents_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "case_documents_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'case-documents'
    and (is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
