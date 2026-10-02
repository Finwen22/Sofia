-- Sofía · color de la app elegido por cada persona (no por familia).
alter table public.family_members
  add column theme text not null default 'arena'
  check (theme in ('arena', 'celeste', 'durazno', 'lavanda', 'salvia', 'rosa'));
-- La política members_update ya permite que cada uno edite su propia fila,
-- y el trigger guard_member_role impide tocar rol o familia.
