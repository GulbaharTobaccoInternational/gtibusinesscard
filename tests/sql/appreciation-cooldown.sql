-- Run with psql -v ON_ERROR_STOP=1 against a local migrated Supabase database.
begin;
do $$
declare
  actor uuid := gen_random_uuid();
  first_click uuid := gen_random_uuid();
  next_click uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (actor);
  insert into public.authorized_users (auth_user_id, email, full_name)
    values (actor, actor::text || '@example.test', 'Test Employee');

  assert public.queue_appreciation(actor, first_click, 'applause', 'gti') = first_click;
  assert public.queue_appreciation(actor, next_click, 'hats-off', 'doubleLeaf') is null;
  assert (select count(*) = 1 from public.feedback_deliveries where auth_user_id = actor);
  assert public.queue_appreciation(actor, first_click, 'applause', 'gti') = first_click;
  assert (select reaction_id = 'applause' and company_id = 'gti' from public.feedback_deliveries where id = first_click);

  update public.feedback_deliveries set occurred_at = clock_timestamp() - interval '10 minutes' where id = first_click;
  assert public.queue_appreciation(actor, next_click, 'coffee-treat', 'doubleLeaf') = next_click;
  assert (select count(*) = 2 from public.feedback_deliveries where auth_user_id = actor);
  assert not has_function_privilege('authenticated', 'public.queue_appreciation(uuid,uuid,text,text)', 'execute');
  assert not has_function_privilege('anon', 'public.queue_appreciation(uuid,uuid,text,text)', 'execute');
end;
$$;
rollback;
