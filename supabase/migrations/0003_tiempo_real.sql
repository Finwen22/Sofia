-- Sofía · cambios en vivo entre los celulares de la familia.
-- Supabase Realtime respeta RLS: cada uno recibe solo los cambios de su familia.
alter publication supabase_realtime add table
  public.feedings, public.diapers, public.sleeps, public.notes,
  public.appointments, public.vaccine_doses, public.growth_records,
  public.shopping_items, public.babies;
