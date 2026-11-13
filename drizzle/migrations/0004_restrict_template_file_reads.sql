drop policy if exists "Anyone reads template files" on storage.objects;
create policy "Anyone reads active template files" on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'templates'
  and exists (
    select 1 from public.templates t
    where t.is_active = true
      and (t.image_path = storage.objects.name or t.thumb_path = storage.objects.name)
  )
);
create policy "Admins read all template files" on storage.objects
for select to authenticated
using (bucket_id = 'templates' and public.has_role(auth.uid(), 'admin'));