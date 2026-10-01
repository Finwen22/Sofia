-- Sofía · prueba de aislamiento entre familias (RLS)
--
-- Se corre entera en Supabase → SQL Editor. Crea usuarios de mentira, prueba
-- lo que cada uno puede y no puede hacer, y SIEMPRE termina con un error a
-- propósito para que Postgres deshaga todo: no deja datos.
-- Leer el mensaje final: "RESULTADO: N/N OK" o la lista de fallas.
--
--   A = admin de la familia 1 (la "real")
--   C = miembro invitado a la familia 1
--   B = admin de otra familia (el intruso)

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  fam_a uuid; fam_b uuid; baby_a uuid; baby_b uuid; feed_a uuid;
  n int;
  total int := 0;
  fallas text[] := '{}';

begin
  -- ── Preparación (como postgres) ──────────────────────────────
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values (a, 'test-a-' || a || '@sofia.test', '{"display_name":"A"}', 'authenticated', 'authenticated');
  select family_id into fam_a from family_members where user_id = a;
  insert into invitations (family_id, email, role) values (fam_a, 'test-c-' || c || '@sofia.test', 'miembro');
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values (c, 'test-c-' || c || '@sofia.test', '{"display_name":"C"}', 'authenticated', 'authenticated'),
         (b, 'test-b-' || b || '@sofia.test', '{"display_name":"B"}', 'authenticated', 'authenticated');
  select family_id into fam_b from family_members where user_id = b;

  insert into babies (family_id, first_name, birth_at) values (fam_a, 'BebeA', now() - interval '10 days') returning id into baby_a;
  insert into babies (family_id, first_name, birth_at) values (fam_b, 'BebeB', now() - interval '10 days') returning id into baby_b;
  insert into feedings (family_id, baby_id, kind, started_at, ended_at) values (fam_a, baby_a, 'pecho', now() - interval '1 hour', now()) returning id into feed_a;
  insert into shopping_items (family_id, name) values (fam_a, 'Pañales');
  insert into push_subscriptions (family_id, user_id, endpoint, p256dh, auth) values (fam_a, a, 'https://push.test/' || a, 'k', 'x');
  insert into storage.objects (bucket_id, name, owner) values ('fotos', fam_a || '/panales/test.jpg', a);

  -- ── Controles positivos: si estos fallan, la prueba no prueba nada ──
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  total := total + 1; select count(*) into n from babies where id = baby_a;
  if n <> 1 then fallas := fallas || 'A no ve su propia bebé'; end if;
  total := total + 1; select count(*) into n from storage.objects where bucket_id = 'fotos' and name like fam_a || '/%';
  if n <> 1 then fallas := fallas || 'A no ve su propia foto'; end if;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  total := total + 1; select count(*) into n from feedings where baby_id = baby_a;
  if n <> 1 then fallas := fallas || 'C (invitado) no ve las tomas de su familia'; end if;
  -- C es miembro: no puede ascenderse a admin
  total := total + 1;
  begin
    update family_members set role = 'admin' where user_id = c;
    fallas := fallas || 'C pudo hacerse admin';
  exception when others then null; end;
  total := total + 1;
  begin
    insert into invitations (family_id, email) values (fam_a, 'otro@sofia.test');
    fallas := fallas || 'C (miembro) pudo invitar';
  exception when others then null; end;
  execute 'reset role';

  -- ── B, el intruso ────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  total := total + 1; select count(*) into n from babies where family_id = fam_a;
  if n <> 0 then fallas := fallas || 'B ve la bebé de A'; end if;
  total := total + 1; select count(*) into n from feedings where family_id = fam_a;
  if n <> 0 then fallas := fallas || 'B ve las tomas de A'; end if;
  total := total + 1; select count(*) into n from family_members where family_id = fam_a;
  if n <> 0 then fallas := fallas || 'B ve los miembros de A'; end if;
  total := total + 1; select count(*) into n from families where id = fam_a;
  if n <> 0 then fallas := fallas || 'B ve la familia de A'; end if;
  total := total + 1; select count(*) into n from shopping_items where family_id = fam_a;
  if n <> 0 then fallas := fallas || 'B ve las compras de A'; end if;
  total := total + 1; select count(*) into n from push_subscriptions where family_id = fam_a;
  if n <> 0 then fallas := fallas || 'B ve los celulares de A'; end if;
  total := total + 1; select count(*) into n from storage.objects where bucket_id = 'fotos' and name like fam_a || '/%';
  if n <> 0 then fallas := fallas || 'B ve las fotos de A'; end if;

  total := total + 1; update babies set first_name = 'hackeado' where id = baby_a; get diagnostics n = row_count;
  if n <> 0 then fallas := fallas || 'B modificó la bebé de A'; end if;
  total := total + 1; delete from feedings where id = feed_a; get diagnostics n = row_count;
  if n <> 0 then fallas := fallas || 'B borró una toma de A'; end if;

  total := total + 1;
  begin
    insert into feedings (family_id, baby_id, kind) values (fam_a, baby_a, 'pecho');
    fallas := fallas || 'B cargó una toma en la familia de A';
  exception when others then null; end;
  total := total + 1;
  begin
    insert into feedings (family_id, baby_id, kind) values (fam_b, baby_a, 'pecho');
    fallas := fallas || 'B cargó una toma a la bebé de A desde su familia';
  exception when others then null; end;
  total := total + 1;
  begin
    insert into family_members (family_id, user_id, display_name) values (fam_a, b, 'B');
    fallas := fallas || 'B se metió como miembro en la familia de A';
  exception when others then null; end;
  total := total + 1;
  begin
    update family_members set family_id = fam_a where user_id = b;
    fallas := fallas || 'B se mudó a la familia de A';
  exception when others then null; end;
  total := total + 1;
  begin
    insert into invitations (family_id, email) values (fam_a, 'yo@sofia.test');
    fallas := fallas || 'B invitó gente a la familia de A';
  exception when others then null; end;
  total := total + 1;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('fotos', fam_a || '/panales/intruso.jpg', b);
    fallas := fallas || 'B subió una foto a la carpeta de A';
  exception when others then null; end;
  total := total + 1;
  begin
    perform 1 from app_secrets;
    fallas := fallas || 'B leyó los secretos del servidor';
  exception when others then null; end;
  total := total + 1;
  begin
    perform push_due_reminders('adivinando');
    fallas := fallas || 'B pidió los avisos sin el secreto';
  exception when others then null; end;

  execute 'reset role';

  -- ── Resultado (el error deshace todo lo de arriba) ───────────
  if array_length(fallas, 1) is null then
    raise exception 'RESULTADO: %/% OK (los datos de prueba se deshicieron)', total, total;
  else
    raise exception 'RESULTADO: % FALLAS de %: %', array_length(fallas, 1), total, array_to_string(fallas, ' | ');
  end if;
end $$;
