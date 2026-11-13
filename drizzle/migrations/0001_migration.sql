-- templates bucket: everyone reads, only admins write
create policy "Anyone reads template files" on storage.objects
  for select to anon, authenticated using (bucket_id = 'templates');
create policy "Admins upload template files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'templates' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update template files" on storage.objects
  for update to authenticated
  using (bucket_id = 'templates' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'templates' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete template files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'templates' and public.has_role(auth.uid(), 'admin'));

-- user-images bucket: each user only touches the folder named with their user id
create policy "Users read own images" on storage.objects
  for select to authenticated
  using (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users upload own images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own images" on storage.objects
  for update to authenticated
  using (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);