alter table public.pets add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pet photos select own" on storage.objects;
drop policy if exists "pet photos insert own" on storage.objects;
drop policy if exists "pet photos update own" on storage.objects;
drop policy if exists "pet photos delete own" on storage.objects;

create policy "pet photos select own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "pet photos insert own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "pet photos update own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "pet photos delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

comment on column public.pets.photo_path is
  'Chemin privé de la photo de profil de l’animal dans le bucket pet-photos.';
