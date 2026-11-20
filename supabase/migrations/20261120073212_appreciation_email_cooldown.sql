create index feedback_deliveries_user_time_idx
  on public.feedback_deliveries (auth_user_id, occurred_at desc);

create function public.queue_appreciation(p_user_id uuid, p_id uuid, p_reaction text, p_company text)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  employee public.authorized_users%rowtype;
  event_time timestamptz;
  queued_id uuid;
begin
  -- Every tab, company and device for this employee takes the same row lock.
  select * into employee from public.authorized_users
    where auth_user_id = p_user_id and status = 'active' and p_company = any(allowed_companies)
    for no key update;
  if not found then
    raise exception 'Company access required' using errcode = '42501';
  end if;

  if exists (select 1 from public.feedback_deliveries where id = p_id and auth_user_id = p_user_id) then
    return p_id; -- An idempotent retry can recover its original delivery.
  end if;
  event_time := clock_timestamp();
  if exists (select 1 from public.feedback_deliveries
    where auth_user_id = p_user_id and occurred_at > event_time - interval '10 minutes') then
    return null;
  end if;

  insert into public.feedback_deliveries (id, auth_user_id, actor_name, actor_email, reaction_id, company_id, occurred_at)
    values (p_id, p_user_id, employee.full_name, employee.email, p_reaction, p_company, event_time)
    returning id into queued_id;
  return queued_id;
end;
$$;

revoke all on function public.queue_appreciation(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.queue_appreciation(uuid,uuid,text,text) to service_role;
