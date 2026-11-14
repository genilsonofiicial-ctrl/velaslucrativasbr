alter table public.templates
  add column if not exists cover_path text,
  add column if not exists zip_path text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists purchase_url text;

create table public.template_images (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  original_path text not null,
  thumb_path text,
  title text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index template_images_template_idx on public.template_images(template_id, sort_order);
grant select on public.template_images to anon;
grant select, insert, update, delete on public.template_images to authenticated;
grant all on public.template_images to service_role;
alter table public.template_images enable row level security;
create policy "Anyone reads active pack images" on public.template_images for select to anon, authenticated
  using (is_active = true and exists (select 1 from public.templates t where t.id = template_id and t.is_active = true));
create policy "Admins read pack images" on public.template_images for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert pack images" on public.template_images for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update pack images" on public.template_images for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete pack images" on public.template_images for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.pack_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template_id uuid references public.templates(id) on delete set null,
  kind text not null check (kind in ('email','download','studio')),
  status text not null default 'ok',
  created_at timestamptz not null default now()
);
create index pack_deliveries_user_idx on public.pack_deliveries(user_id, created_at desc);
grant select on public.pack_deliveries to authenticated;
grant all on public.pack_deliveries to service_role;
alter table public.pack_deliveries enable row level security;
create policy "Users read own deliveries" on public.pack_deliveries for select to authenticated using (user_id = auth.uid());
create policy "Admins read deliveries" on public.pack_deliveries for select to authenticated using (public.has_role(auth.uid(), 'admin'));

alter table public.profiles
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz;
grant update (marketing_consent, marketing_consent_at) on public.profiles to authenticated;

create policy "Admins read pack files" on storage.objects for select to authenticated
  using (bucket_id = 'pack-files' and public.has_role(auth.uid(), 'admin'));
create policy "Admins upload pack files" on storage.objects for insert to authenticated
  with check (bucket_id = 'pack-files' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update pack files" on storage.objects for update to authenticated
  using (bucket_id = 'pack-files' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'pack-files' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete pack files" on storage.objects for delete to authenticated
  using (bucket_id = 'pack-files' and public.has_role(auth.uid(), 'admin'));

create or replace function public.admin_pack_metrics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'packs', coalesce((select jsonb_agg(x order by x.views desc) from (
      select t.id, t.title, t.theme,
        (select count(*) from events e where e.name = 'pack_viewed' and e.props->>'template_id' = t.id::text) as views,
        (select count(*) from events e where e.name in ('pack_downloaded','pack_email_sent') and e.props->>'template_id' = t.id::text) as downloads,
        (select count(*) from events e where e.name = 'pack_signup_completed' and e.props->>'template_id' = t.id::text) as signups
      from templates t where t.cover_path is not null or exists (select 1 from events e where e.props->>'template_id' = t.id::text and e.name like 'pack_%')
    ) x), '[]'::jsonb),
    'funnel', jsonb_build_object(
      'views', (select count(distinct session_id) from events where name = 'pack_viewed'),
      'signups', (select count(distinct session_id) from events where name = 'pack_signup_completed'),
      'used', (select count(distinct session_id) from events where name in ('pack_downloaded','pack_email_sent','pack_image_to_studio')),
      'exports', (select count(distinct session_id) from events where name in ('export_pdf','export_png') and session_id in (select session_id from events where name = 'pack_image_to_studio'))
    ),
    'emails', coalesce((select jsonb_agg(jsonb_build_object('email', p.email, 'consent', p.marketing_consent, 'consent_at', p.marketing_consent_at, 'created_at', p.created_at) order by p.created_at desc) from profiles p), '[]'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_pack_metrics() from public, anon;
grant execute on function public.admin_pack_metrics() to authenticated;