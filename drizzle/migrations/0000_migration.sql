-- Roles (kept in a separate table to avoid privilege escalation)
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "Admins read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Shared updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (email) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) templates
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text,
  occasion text,
  tags text[] not null default '{}',
  image_path text,
  thumb_path text,
  aspect_ratio numeric,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  license_note text,
  created_at timestamptz not null default now()
);
grant select on public.templates to anon;
grant select, insert, update, delete on public.templates to authenticated;
grant all on public.templates to service_role;
alter table public.templates enable row level security;

create policy "Anyone reads active templates" on public.templates
  for select to anon, authenticated using (is_active = true);
create policy "Admins read all templates" on public.templates
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert templates" on public.templates
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update templates" on public.templates
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete templates" on public.templates
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 3) projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null default 'Minha vela',
  candle_diameter_cm numeric,
  candle_height_cm numeric,
  margin_cm numeric,
  mode text not null default 'wrap' check (mode in ('wrap', 'front')),
  arc_degrees numeric,
  sheet text not null default 'A4' check (sheet in ('A4', 'LETTER')),
  printer_margin_cm numeric,
  template_id uuid references public.templates(id) on delete set null,
  custom_image_path text,
  transform jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_id_idx on public.projects(user_id);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;

create policy "Users read own projects" on public.projects
  for select to authenticated using (user_id = auth.uid());
create policy "Users insert own projects" on public.projects
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users update own projects" on public.projects
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users delete own projects" on public.projects
  for delete to authenticated using (user_id = auth.uid());

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 4) events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant insert on public.events to anon;
grant select, insert on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;

create policy "Anyone inserts events" on public.events
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy "Admins read events" on public.events
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 5) feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  helped boolean,
  willing_to_pay text,
  comment text,
  created_at timestamptz not null default now()
);
grant insert on public.feedback to anon;
grant select, insert on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;

create policy "Anyone inserts feedback" on public.feedback
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy "Admins read feedback" on public.feedback
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));