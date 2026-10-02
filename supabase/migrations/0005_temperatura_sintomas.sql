-- Sofía · temperatura y síntomas + recordatorios puntuales ("volvé a medir")

create table public.health_logs (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null,
  baby_id       uuid not null,
  observed_at   timestamptz not null default now(),
  temperature_c numeric(3,1) check (temperature_c is null or temperature_c between 34 and 43),
  method        text check (method in ('axilar', 'rectal', 'oido', 'frente')),
  symptoms      text[] not null default '{}',
  notes         text,
  created_by    uuid default auth.uid() references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  check (temperature_c is not null or cardinality(symptoms) > 0 or notes is not null),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);
create index health_logs_baby_observed on public.health_logs(baby_id, observed_at desc);

alter table public.health_logs enable row level security;
create policy health_logs_member on public.health_logs for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));

-- Recordatorios de una sola vez (ej.: "volvé a tomarle la temperatura").
create table public.one_off_reminders (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  due_at     timestamptz not null,
  title      text not null,
  body       text not null,
  url        text not null default '/',
  sent_at    timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index one_off_reminders_pending on public.one_off_reminders(due_at) where sent_at is null;
alter table public.one_off_reminders enable row level security;
create policy one_off_member on public.one_off_reminders for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));

alter publication supabase_realtime add table public.health_logs;

-- ─────────────────────────────────────────────────────────────
-- Push: suma los recordatorios puntuales (vencidos hace menos de 2 h)
-- ─────────────────────────────────────────────────────────────
create or replace function public.push_due_reminders(p_secret text)
returns table (endpoint text, p256dh text, auth text, title text, body text, url text)
language plpgsql security definer set search_path = public as $$
declare
  r record;
  hora text;
  faltan int;
begin
  if p_secret is null or p_secret is distinct from (select value from app_secrets where key = 'push_cron_secret') then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  for r in select * from _due_feed_reminders() loop
    insert into feed_reminder_log (baby_id, session_start) values (r.baby_id, r.session_start)
    on conflict do nothing;
    if not found then continue; end if;

    hora := to_char(r.proxima at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI');
    faltan := ceil(extract(epoch from (r.proxima - now())) / 60);

    return query
      select ps.endpoint, ps.p256dh, ps.auth,
             'Próxima toma de ' || r.first_name,
             case when faltan <= 0 then 'Ya es la hora de la toma (' || hora || ').'
                  else 'Le toca a las ' || hora || ', en ' || faltan || ' min.' end,
             '/registrar/toma'::text
      from push_subscriptions ps
      where ps.family_id = r.family_id;
  end loop;

  for r in select * from _due_med_reminders() loop
    insert into med_reminder_log (medication_id, due_at) values (r.medication_id, r.due_at)
    on conflict do nothing;
    if not found then continue; end if;

    hora := to_char(r.due_at at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI');

    return query
      select ps.endpoint, ps.p256dh, ps.auth,
             r.name || ' para ' || r.first_name,
             coalesce(r.dose || ' · ', '') || 'Tocaba a las ' || hora || '. Marcala en la app cuando se la den.',
             '/salud/medicamentos'::text
      from push_subscriptions ps
      where ps.family_id = r.family_id;
  end loop;

  for r in
    update one_off_reminders o set sent_at = now()
    where o.sent_at is null and o.due_at <= now() and o.due_at > now() - interval '2 hours'
    returning o.family_id, o.title, o.body, o.url
  loop
    return query
      select ps.endpoint, ps.p256dh, ps.auth, r.title, r.body, r.url
      from push_subscriptions ps
      where ps.family_id = r.family_id;
  end loop;
end;
$$;

create or replace function public.push_tick()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_url    text := (select value from app_secrets where key = 'push_tick_url');
  v_secret text := (select value from app_secrets where key = 'push_cron_secret');
begin
  if v_url is null or v_secret is null then return; end if;
  if not exists (select 1 from _due_feed_reminders())
     and not exists (select 1 from _due_med_reminders())
     and not exists (select 1 from one_off_reminders
                      where sent_at is null and due_at <= now() and due_at > now() - interval '2 hours') then
    return;
  end if;
  perform net.http_get(url := v_url, headers := jsonb_build_object('x-cron-secret', v_secret), timeout_milliseconds := 10000);
end;
$$;
revoke execute on function public.push_tick() from public, anon, authenticated;
