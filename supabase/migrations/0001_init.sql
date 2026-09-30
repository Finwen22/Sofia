-- Sofía · esquema inicial
-- Una "familia" agrupa a quienes cuidan a la bebé. Todo lo que se registra
-- cuelga de una familia y solo sus miembros lo ven (RLS).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Familias y miembros
-- ─────────────────────────────────────────────────────────────
create type public.member_role as enum ('admin', 'miembro');

create table public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id    uuid not null references public.families(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.member_role not null default 'miembro',
  display_name text not null,
  created_at   timestamptz not null default now(),
  primary key (family_id, user_id)
);
-- Por ahora cada persona pertenece a una sola familia.
create unique index family_members_one_family on public.family_members(user_id);

-- Alta de usuarios desde Ajustes: el admin invita un email; cuando esa
-- persona se registra con ese email, entra directo a la familia.
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  email       text not null,
  role        public.member_role not null default 'miembro',
  invited_by  uuid references auth.users(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (family_id, email)
);

create or replace function public.is_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid());
$$;

create or replace function public.is_admin(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv   invitations;
  fid   uuid;
  dname text;
begin
  dname := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1));

  select * into inv from invitations
   where lower(email) = lower(new.email) and accepted_at is null
   order by created_at desc limit 1;

  if found then
    insert into family_members (family_id, user_id, role, display_name)
    values (inv.family_id, new.id, inv.role, dname);
    update invitations set accepted_at = now() where id = inv.id;
  else
    insert into families (name) values ('Familia de ' || dname) returning id into fid;
    insert into family_members (family_id, user_id, role, display_name)
    values (fid, new.id, 'admin', dname);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Ficha de la bebé
-- ─────────────────────────────────────────────────────────────
create table public.babies (
  id                 uuid primary key default gen_random_uuid(),
  family_id          uuid not null references public.families(id) on delete cascade,
  first_name         text not null,
  last_name          text,
  sex                text check (sex in ('femenino', 'masculino')),
  birth_at           timestamptz not null,
  birth_weight_g     int  check (birth_weight_g between 300 and 7000),
  birth_length_cm    numeric(4,1) check (birth_length_cm between 20 and 70),
  birth_head_cm      numeric(4,1) check (birth_head_cm between 20 and 50),
  gestation_weeks    int  check (gestation_weeks between 20 and 45),
  delivery_type      text check (delivery_type in ('natural', 'cesarea')),
  birthplace         text,
  blood_type         text,
  neonatal_screening boolean,
  hearing_screening  boolean,
  allergies          text,
  health_insurance   text,
  insurance_number   text,
  pediatrician_name  text,
  pediatrician_phone text,
  feeding_mode       text check (feeding_mode in ('pecho', 'mixta', 'formula')),
  notes              text,
  created_at         timestamptz not null default now(),
  unique (id, family_id)
);

-- Cada registro lleva family_id (para RLS) y la FK compuesta garantiza que
-- la bebé pertenezca a esa misma familia.

-- Tomas: pecho (con lado y duración) o mamadera (ml, materna o fórmula).
-- ended_at null = toma en curso (cronómetro).
create table public.feedings (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null,
  baby_id    uuid not null,
  kind       text not null check (kind in ('pecho', 'mamadera')),
  side       text check (side in ('izquierdo', 'derecho', 'ambos')),
  milk       text check (milk in ('materna', 'formula')),
  amount_ml  int  check (amount_ml between 1 and 400),
  started_at timestamptz not null default now(),
  ended_at   timestamptz check (ended_at is null or ended_at >= started_at),
  notes      text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);
create index feedings_baby_started on public.feedings(baby_id, started_at desc);

create table public.diapers (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null,
  baby_id     uuid not null,
  changed_at  timestamptz not null default now(),
  pee         boolean not null default false,
  poop        boolean not null default false,
  poop_color  text check (poop_color in ('meconio', 'amarillo', 'verde', 'marron', 'naranja', 'rojo', 'negro', 'blanco')),
  consistency text check (consistency in ('liquida', 'blanda', 'pastosa', 'grumosa', 'dura')),
  notes       text,
  photo_path  text,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  check (pee or poop),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);
create index diapers_baby_changed on public.diapers(baby_id, changed_at desc);

create table public.sleeps (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null,
  baby_id    uuid not null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz check (ended_at is null or ended_at >= started_at),
  notes      text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);
create index sleeps_baby_started on public.sleeps(baby_id, started_at desc);

-- Notas sueltas; for_doctor = pregunta para el próximo control.
create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null,
  baby_id    uuid not null,
  body       text not null check (length(trim(body)) > 0),
  for_doctor boolean not null default false,
  resolved   boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);

create table public.appointments (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null,
  baby_id      uuid not null,
  scheduled_at timestamptz not null,
  kind         text not null,
  professional text,
  place        text,
  notes        text,
  outcome      text,
  done         boolean not null default false,
  created_by   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);
create index appointments_baby_sched on public.appointments(baby_id, scheduled_at);

create table public.growth_records (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null,
  baby_id     uuid not null,
  measured_on date not null,
  weight_g    int check (weight_g between 300 and 30000),
  length_cm   numeric(4,1) check (length_cm between 20 and 130),
  head_cm     numeric(4,1) check (head_cm between 20 and 60),
  notes       text,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  check (weight_g is not null or length_cm is not null or head_cm is not null),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);

-- Dosis aplicadas. El calendario (qué dosis y cuándo) vive en el código.
create table public.vaccine_doses (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null,
  baby_id      uuid not null,
  vaccine_code text not null,
  applied_on   date not null,
  lot          text,
  place        text,
  notes        text,
  created_by   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (baby_id, vaccine_code),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);

create table public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  quantity   text,
  category   text not null default 'otros',
  done       boolean not null default false,
  done_at    timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.invitations    enable row level security;

create policy families_select on public.families for select using (public.is_member(id));
create policy families_update on public.families for update using (public.is_admin(id)) with check (public.is_admin(id));

create policy members_select on public.family_members for select using (public.is_member(family_id));
create policy members_update on public.family_members for update
  using (user_id = auth.uid() or public.is_admin(family_id))
  with check (user_id = auth.uid() or public.is_admin(family_id));
-- El admin puede sacar a otros miembros, no a sí mismo.
create policy members_delete on public.family_members for delete
  using (public.is_admin(family_id) and user_id <> auth.uid());

create policy invitations_select on public.invitations for select using (public.is_admin(family_id));
create policy invitations_insert on public.invitations for insert with check (public.is_admin(family_id));
create policy invitations_delete on public.invitations for delete using (public.is_admin(family_id));

-- Un miembro no puede cambiarse el rol a sí mismo.
create or replace function public.guard_member_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and not public.is_admin(old.family_id) then
    raise exception 'Solo un admin puede cambiar roles';
  end if;
  if new.family_id <> old.family_id or new.user_id <> old.user_id then
    raise exception 'No se puede mover un miembro de familia';
  end if;
  return new;
end;
$$;
create trigger family_members_guard before update on public.family_members
  for each row execute function public.guard_member_role();

do $$
declare t text;
begin
  foreach t in array array['babies','feedings','diapers','sleeps','notes','appointments',
                           'growth_records','vaccine_doses','shopping_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all using (public.is_member(family_id)) with check (public.is_member(family_id))',
                   t || '_member', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Fotos (privadas): ruta <family_id>/<carpeta>/<archivo>
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy fotos_select on storage.objects for select
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] in
         (select family_id::text from public.family_members where user_id = auth.uid()));
create policy fotos_insert on storage.objects for insert
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] in
         (select family_id::text from public.family_members where user_id = auth.uid()));
create policy fotos_delete on storage.objects for delete
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] in
         (select family_id::text from public.family_members where user_id = auth.uid()));
