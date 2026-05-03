-- Ensure the project thumbnails bucket exists and can be read via public URLs.
insert into storage.buckets (id, name, public)
values ('project-thumbnails', 'project-thumbnails', true)
on conflict (id) do update set public = excluded.public;

-- Allow authenticated users in the app to upload thumbnail files.
drop policy if exists "Authenticated users can insert project thumbnails" on storage.objects;
create policy "Authenticated users can insert project thumbnails"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'project-thumbnails');

-- Allow authenticated users to overwrite existing thumbnail files when saving.
drop policy if exists "Authenticated users can update project thumbnails" on storage.objects;
create policy "Authenticated users can update project thumbnails"
on storage.objects
for update
to authenticated
using (bucket_id = 'project-thumbnails')
with check (bucket_id = 'project-thumbnails');