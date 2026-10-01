-- Sofía · sumar a una persona que ya tiene cuenta a la familia de otra.
-- Caso: se la invitó desde el panel de Supabase y la base le creó una
-- familia propia (vacía). Reemplazar los dos emails y correr en el SQL Editor.

do $$
declare
  mail_quien   text := 'EMAIL_DE_ELLA@ejemplo.com';  -- la persona a sumar
  mail_familia text := 'TU_EMAIL@ejemplo.com';       -- alguien que ya está en la familia
  v_user uuid; v_dest uuid; v_actual uuid; v_nombre text;
begin
  select id, coalesce(nullif(trim(raw_user_meta_data->>'display_name'), ''), split_part(email, '@', 1))
    into v_user, v_nombre from auth.users where lower(email) = lower(mail_quien);
  if v_user is null then raise exception 'No existe una cuenta con %', mail_quien; end if;

  select fm.family_id into v_dest from family_members fm join auth.users u on u.id = fm.user_id
   where lower(u.email) = lower(mail_familia);
  if v_dest is null then raise exception '% no está en ninguna familia', mail_familia; end if;

  select family_id into v_actual from family_members where user_id = v_user;
  if v_actual = v_dest then raise exception 'LISTO: % ya está en esa familia, no hay nada que hacer', mail_quien; end if;

  if v_actual is not null then
    if exists (select 1 from babies where family_id = v_actual) then
      raise exception 'La familia actual de % tiene una bebé cargada: no la borro. Avisale a Claude.', mail_quien;
    end if;
    delete from families where id = v_actual;  -- vacía; se lleva su membresía
  end if;

  insert into family_members (family_id, user_id, role, display_name) values (v_dest, v_user, 'admin', v_nombre);
  update invitations set accepted_at = now() where family_id = v_dest and lower(email) = lower(mail_quien) and accepted_at is null;
  raise notice 'LISTO: % ahora está en la familia (como admin)', mail_quien;
end $$;
