-- Sofía · recordatorio push de la próxima toma
--
-- Cómo funciona: pg_cron corre cada minuto dentro de Supabase. Si hay algún
-- recordatorio vencido, llama (pg_net) a /api/push/tick de la app. Esa ruta
-- pide los avisos con push_due_reminders(secreto), que los marca como
-- enviados, y los manda por Web Push a cada celular suscripto.
-- La URL y el secreto NO van en este archivo: se cargan aparte en app_secrets.

-- ─────────────────────────────────────────────────────────────
-- Configuración por bebé
-- ─────────────────────────────────────────────────────────────
alter table public.babies
  add column feed_reminders         boolean not null default false,
  add column feed_interval_min      int     not null default 180 check (feed_interval_min between 30 and 720),
  add column feed_reminder_lead_min int     not null default 30  check (feed_reminder_lead_min between 0 and 180);

-- ─────────────────────────────────────────────────────────────
-- Celulares suscriptos (uno por navegador/dispositivo)
-- ─────────────────────────────────────────────────────────────
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy push_subs_select on public.push_subscriptions for select
  using (user_id = auth.uid());
create policy push_subs_insert on public.push_subscriptions for insert
  with check (user_id = auth.uid() and public.is_member(family_id));
create policy push_subs_update on public.push_subscriptions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(family_id));
create policy push_subs_delete on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- Un aviso por sesión de toma (no se repite si cambian de pecho).
create table public.feed_reminder_log (
  baby_id       uuid not null references public.babies(id) on delete cascade,
  session_start timestamptz not null,
  sent_at       timestamptz not null default now(),
  primary key (baby_id, session_start)
);
alter table public.feed_reminder_log enable row level security; -- sin políticas: solo funciones

-- Secretos del servidor: sin políticas, nadie los lee por la API.
create table public.app_secrets (
  key   text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Recordatorios vencidos
-- ─────────────────────────────────────────────────────────────
-- La toma se cuenta desde el inicio de la sesión: si una toma arrancó menos
-- de 45 min después de otra (el otro pecho), la sesión empieza en la primera.
create or replace function public._due_feed_reminders()
returns table (baby_id uuid, family_id uuid, first_name text, session_start timestamptz, proxima timestamptz)
language sql stable security definer set search_path = public as $$
  with ult as (
    select distinct on (f.baby_id) f.baby_id, f.started_at, f.ended_at
    from feedings f
    join babies b on b.id = f.baby_id and b.feed_reminders
    order by f.baby_id, f.started_at desc
  ),
  ses as (
    select u.baby_id, u.ended_at,
           coalesce((select min(f2.started_at) from feedings f2
                      where f2.baby_id = u.baby_id
                        and f2.started_at >= u.started_at - interval '45 minutes'
                        and f2.started_at <  u.started_at), u.started_at) as session_start
    from ult u
  )
  select b.id, b.family_id, b.first_name, s.session_start,
         s.session_start + make_interval(mins => b.feed_interval_min)
  from ses s
  join babies b on b.id = s.baby_id
  where s.ended_at is not null                                   -- no avisar con una toma en curso
    and now() >= s.session_start + make_interval(mins => b.feed_interval_min - b.feed_reminder_lead_min)
    and now() <  s.session_start + make_interval(mins => b.feed_interval_min + 60) -- después de 1 h de atraso, ya no
    and not exists (select 1 from feed_reminder_log l
                     where l.baby_id = b.id and l.session_start = s.session_start);
$$;
revoke execute on function public._due_feed_reminders() from public, anon, authenticated;

-- La llama la app (/api/push/tick) con el secreto. Devuelve un mensaje por
-- celular suscripto y deja registrado el aviso para no repetirlo.
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
    if not found then continue; end if; -- otro proceso ya lo mandó

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
end;
$$;

-- Limpia suscripciones que el navegador dio de baja (404/410).
create or replace function public.push_prune(p_secret text, p_endpoints text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or p_secret is distinct from (select value from app_secrets where key = 'push_cron_secret') then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  delete from push_subscriptions where endpoint = any (p_endpoints);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Programador: cada minuto, solo llama a la app si hay algo vencido
-- ─────────────────────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.push_tick()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_url    text := (select value from app_secrets where key = 'push_tick_url');
  v_secret text := (select value from app_secrets where key = 'push_cron_secret');
begin
  if v_url is null or v_secret is null then return; end if;
  if not exists (select 1 from _due_feed_reminders()) then return; end if;
  perform net.http_get(url := v_url, headers := jsonb_build_object('x-cron-secret', v_secret), timeout_milliseconds := 10000);
end;
$$;
revoke execute on function public.push_tick() from public, anon, authenticated;

select cron.schedule('sofia-recordatorio-tomas', '* * * * *', 'select public.push_tick()');
