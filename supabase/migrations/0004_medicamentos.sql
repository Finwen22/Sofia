-- Sofía · medicamentos y suplementos
-- La app NO indica dosis: registra lo que indicó el pediatra, quién la dio y
-- cuándo, y avisa por push cuando toca.

create table public.medications (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null,
  baby_id        uuid not null,
  name           text not null check (length(trim(name)) > 0),
  dose           text,                                   -- tal cual lo indicó el pediatra: "1 gota", "2,5 ml"
  kind           text not null check (kind in ('diaria', 'intervalo', 'si_hace_falta')),
  times          time[] not null default '{}',           -- diaria: horarios (hora argentina)
  interval_hours numeric(4,1) check (interval_hours is null or interval_hours between 1 and 72),
  starts_on      date not null default ((now() at time zone 'America/Argentina/Buenos_Aires')::date),
  ends_on        date,
  reminders      boolean not null default true,
  active         boolean not null default true,
  prescribed_by  text,
  notes          text,
  created_by     uuid default auth.uid() references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (id, family_id),
  check (ends_on is null or ends_on >= starts_on),
  check (kind <> 'diaria' or cardinality(times) between 1 and 6),
  check (kind <> 'intervalo' or interval_hours is not null),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);

create table public.medication_doses (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null,
  baby_id       uuid not null,
  medication_id uuid not null,
  given_at      timestamptz not null default now(),
  notes         text,
  created_by    uuid default auth.uid() references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade,
  foreign key (medication_id, family_id) references public.medications(id, family_id) on delete cascade
);
create index medication_doses_med_given on public.medication_doses(medication_id, given_at desc);

alter table public.medications      enable row level security;
alter table public.medication_doses enable row level security;
create policy medications_member on public.medications for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));
create policy medication_doses_member on public.medication_doses for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));

alter publication supabase_realtime add table public.medications, public.medication_doses;

-- ─────────────────────────────────────────────────────────────
-- Recordatorios de medicamentos
-- ─────────────────────────────────────────────────────────────
create table public.med_reminder_log (
  medication_id uuid not null references public.medications(id) on delete cascade,
  due_at        timestamptz not null,
  sent_at       timestamptz not null default now(),
  primary key (medication_id, due_at)
);
alter table public.med_reminder_log enable row level security; -- sin políticas: solo funciones

-- Dosis vencidas sin dar. Diaria: cada horario de hoy; se considera dada si
-- hubo una dosis desde 3 h antes del horario. Intervalo: última dosis + X h.
-- Se avisa durante las 2 h siguientes al horario, una sola vez.
create or replace function public._due_med_reminders()
returns table (medication_id uuid, family_id uuid, first_name text, name text, dose text, due_at timestamptz)
language sql stable security definer set search_path = public as $$
  with hoy as (select (now() at time zone 'America/Argentina/Buenos_Aires')::date as d),
  activos as (
    select m.*, b.first_name as baby_name
    from medications m
    join babies b on b.id = m.baby_id
    cross join hoy
    where m.active and m.reminders
      and hoy.d >= m.starts_on and (m.ends_on is null or hoy.d <= m.ends_on)
  ),
  diarias as (
    select a.id, a.family_id, a.baby_name, a.name, a.dose,
           ((select d from hoy) + t) at time zone 'America/Argentina/Buenos_Aires' as due_at
    from activos a, unnest(a.times) as t
    where a.kind = 'diaria'
  ),
  intervalos as (
    select a.id, a.family_id, a.baby_name, a.name, a.dose,
           (select max(md.given_at) from medication_doses md where md.medication_id = a.id)
             + make_interval(secs => (a.interval_hours * 3600)::int) as due_at
    from activos a
    where a.kind = 'intervalo'
  ),
  todas as (select * from diarias union all select * from intervalos where due_at is not null)
  select t.id, t.family_id, t.baby_name, t.name, t.dose, t.due_at
  from todas t
  where now() >= t.due_at and now() < t.due_at + interval '2 hours'
    and not exists (select 1 from medication_doses md
                     where md.medication_id = t.id and md.given_at >= t.due_at - interval '3 hours')
    and not exists (select 1 from med_reminder_log l where l.medication_id = t.id and l.due_at = t.due_at);
$$;
revoke execute on function public._due_med_reminders() from public, anon, authenticated;

-- Reemplaza la de 0002: ahora devuelve avisos de tomas y de medicamentos.
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
end;
$$;

create or replace function public.push_tick()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_url    text := (select value from app_secrets where key = 'push_tick_url');
  v_secret text := (select value from app_secrets where key = 'push_cron_secret');
begin
  if v_url is null or v_secret is null then return; end if;
  if not exists (select 1 from _due_feed_reminders()) and not exists (select 1 from _due_med_reminders()) then
    return;
  end if;
  perform net.http_get(url := v_url, headers := jsonb_build_object('x-cron-secret', v_secret), timeout_milliseconds := 10000);
end;
$$;
revoke execute on function public.push_tick() from public, anon, authenticated;
