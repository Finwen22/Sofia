-- Sofía · diario de recuerdos y primeras veces (con fotos)

create table public.diary_entries (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null,
  baby_id     uuid not null,
  happened_on date not null,
  milestone   text,              -- código de "primera vez" (src/lib/hitos.ts); null = recuerdo libre
  title       text not null check (length(trim(title)) > 0),
  body        text,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (id, family_id),
  foreign key (baby_id, family_id) references public.babies(id, family_id) on delete cascade
);
create index diary_entries_baby_date on public.diary_entries(baby_id, happened_on desc);
-- Cada primera vez se registra una sola vez.
create unique index diary_entries_one_milestone on public.diary_entries(baby_id, milestone) where milestone is not null;

create table public.diary_photos (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null,
  entry_id   uuid not null,
  path       text not null,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  foreign key (entry_id, family_id) references public.diary_entries(id, family_id) on delete cascade,
  check (path like family_id::text || '/diario/%')
);
create index diary_photos_entry on public.diary_photos(entry_id, position);

alter table public.diary_entries enable row level security;
alter table public.diary_photos  enable row level security;
create policy diary_entries_member on public.diary_entries for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));
create policy diary_photos_member on public.diary_photos for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));

alter publication supabase_realtime add table public.diary_entries, public.diary_photos;
