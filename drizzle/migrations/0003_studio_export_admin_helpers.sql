alter table public.templates add column if not exists description text;
alter table public.projects add column if not exists thumbnail text;
alter table public.feedback add column if not exists helped_answer text;

create index if not exists events_name_created_idx on public.events (name, created_at);
create index if not exists events_user_idx on public.events (user_id);
create index if not exists events_session_idx on public.events (session_id);

-- Exports this calendar month for the caller (signed in: by user; anonymous: by session)
create or replace function public.export_count_this_month(_session_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.events e
  where e.name in ('export_pdf', 'export_png')
    and e.created_at >= date_trunc('month', now())
    and (
      (auth.uid() is not null and e.user_id = auth.uid())
      or (auth.uid() is null and e.user_id is null and e.session_id = _session_id)
    )
$$;
revoke execute on function public.export_count_this_month(text) from public;
grant execute on function public.export_count_this_month(text) to anon, authenticated;

-- Admin: switch a user's plan
create or replace function public.admin_set_plan(_user_id uuid, _plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not allowed';
  end if;
  if _plan not in ('free', 'pro') then
    raise exception 'invalid plan';
  end if;
  update public.profiles set plan = _plan where id = _user_id;
end;
$$;
revoke execute on function public.admin_set_plan(uuid, text) from public, anon;
grant execute on function public.admin_set_plan(uuid, text) to authenticated;

-- Admin: dashboard numbers in one call
create or replace function public.admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not allowed';
  end if;

  select jsonb_build_object(
    'visitors', (select count(distinct session_id) from public.events where session_id is not null),
    'calcs', (select count(*) from public.events where name = 'calc_completed'),
    'exports', (select count(*) from public.events where name in ('export_pdf', 'export_png')),
    'users', (select count(*) from public.profiles),
    'returning', (
      select count(*) from (
        select coalesce(user_id::text, session_id) as who
        from public.events
        where coalesce(user_id::text, session_id) is not null
        group by 1
        having count(distinct created_at::date) > 1
      ) r
    ),
    'exports_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'count', coalesce(c.cnt, 0)) order by d.day), '[]'::jsonb)
      from generate_series((now()::date - 29), now()::date, interval '1 day') as d(day)
      left join (
        select created_at::date as day, count(*) as cnt
        from public.events
        where name in ('export_pdf', 'export_png') and created_at >= now() - interval '30 days'
        group by 1
      ) c on c.day = d.day::date
    ),
    'pay', (
      select coalesce(jsonb_agg(jsonb_build_object('answer', willing_to_pay, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (
        select willing_to_pay, count(*) as cnt from public.feedback
        where willing_to_pay is not null group by 1
      ) p
    ),
    'helped', (
      select coalesce(jsonb_agg(jsonb_build_object('answer', helped_answer, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (
        select helped_answer, count(*) as cnt from public.feedback
        where helped_answer is not null group by 1
      ) h
    ),
    'comments', (
      select coalesce(jsonb_agg(jsonb_build_object('comment', comment, 'created_at', created_at, 'pay', willing_to_pay) order by created_at desc), '[]'::jsonb)
      from (
        select comment, created_at, willing_to_pay from public.feedback
        where coalesce(trim(comment), '') <> '' order by created_at desc limit 20
      ) f
    ),
    'top_templates', (
      select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', coalesce(tp.title, t.title_prop), 'theme', tp.theme, 'selected', t.selected, 'exported', t.exported) order by t.selected desc), '[]'::jsonb)
      from (
        select props->>'template_id' as id,
               max(props->>'template_title') as title_prop,
               count(*) filter (where name = 'template_selected') as selected,
               count(*) filter (where name in ('export_pdf', 'export_png')) as exported
        from public.events
        where props ? 'template_id' and props->>'template_id' <> ''
        group by 1
        order by 3 desc
        limit 10
      ) t
      left join public.templates tp on tp.id::text = t.id
    )
  ) into result;

  return result;
end;
$$;
revoke execute on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;