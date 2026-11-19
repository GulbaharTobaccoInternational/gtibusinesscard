begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.authorized_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(btrim(email)) and length(email) <= 254),
  full_name text not null check (length(btrim(full_name)) between 1 and 160),
  role text not null default 'employee' check (role in ('admin','employee')),
  status text not null default 'active' check (status in ('active','disabled')),
  allowed_companies text[] not null default array['gti','doubleLeaf']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(allowed_companies) between 1 and 2 and allowed_companies <@ array['gti','doubleLeaf']::text[]),
  check (role <> 'admin' or allowed_companies @> array['gti','doubleLeaf']::text[])
);
alter table public.authorized_users enable row level security;
revoke all on public.authorized_users from anon, authenticated;
grant select on public.authorized_users to authenticated;
grant all on public.authorized_users to service_role;

create function private.is_active_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.authorized_users where auth_user_id = auth.uid() and role = 'admin' and status = 'active');
$$;
grant usage on schema private to authenticated;
grant execute on function private.is_active_admin() to authenticated;
create policy "Read own authorization or administer directory" on public.authorized_users
for select to authenticated using (auth_user_id = (select auth.uid()) or (select private.is_active_admin()));

create function private.protect_administrator() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(715419021);
  if old.role = 'admin' and old.status = 'active' then
    if tg_op = 'DELETE' or new.role <> 'admin' or new.status <> 'active' then
      if not exists(select 1 from public.authorized_users where id <> old.id and role = 'admin' and status = 'active') then
        raise exception 'Keep at least one active administrator' using errcode = '23514';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger protect_administrator before update or delete on public.authorized_users
for each row execute function private.protect_administrator();

create table private.request_limits (
  key text primary key,
  hits integer not null,
  expires_at timestamptz not null
);
create function public.take_request_quota(p_key text, p_limit integer, p_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare current_hits integer;
begin
  if p_limit not between 1 and 1000 or p_seconds not between 1 and 86400 or length(p_key) > 128 then
    raise exception 'Invalid quota';
  end if;
  delete from private.request_limits where expires_at < now() - interval '1 day';
  insert into private.request_limits as limits (key,hits,expires_at)
    values (p_key,1,now()+make_interval(secs=>p_seconds))
    on conflict(key) do update set
      hits = case when limits.expires_at <= now() then 1 else least(limits.hits+1,p_limit+1) end,
      expires_at = case when limits.expires_at <= now() then now()+make_interval(secs=>p_seconds) else limits.expires_at end
    returning hits into current_hits;
  return current_hits <= p_limit;
end;
$$;
revoke all on function public.take_request_quota(text,integer,integer) from public,anon,authenticated;
grant execute on function public.take_request_quota(text,integer,integer) to service_role;

-- Delivery records contain the verified actor, never card data or OTPs.
create table public.feedback_deliveries (
  id uuid primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  actor_name text not null,
  actor_email text not null,
  reaction_id text not null check(reaction_id in ('applause','great-job','coffee-treat','hats-off')),
  company_id text not null check(company_id in ('gti','doubleLeaf')),
  occurred_at timestamptz not null default now(),
  state text not null default 'pending' check(state in ('pending','processing','accepted','failed')),
  attempts integer not null default 0,
  lease_until timestamptz,
  provider_id text,
  error_code text,
  updated_at timestamptz not null default now()
);
alter table public.feedback_deliveries enable row level security;
revoke all on public.feedback_deliveries from anon,authenticated;
grant all on public.feedback_deliveries to service_role;

create function public.claim_feedback(p_id uuid) returns setof public.feedback_deliveries
language sql security definer set search_path = '' as $$
  update public.feedback_deliveries d set state='processing', attempts=d.attempts+1,
    lease_until=now()+interval '40 seconds',updated_at=now()
  where d.id=p_id and d.attempts<3
    and (d.state in ('pending','failed') or (d.state='processing' and d.lease_until<now()))
    and d.occurred_at>now()-interval '23 hours'
    and exists(select 1 from public.authorized_users u where u.auth_user_id=d.auth_user_id
      and u.status='active' and d.company_id=any(u.allowed_companies))
  returning d.*;
$$;
revoke all on function public.claim_feedback(uuid) from public,anon,authenticated;
grant execute on function public.claim_feedback(uuid) to service_role;
revoke all on all functions in schema private from public,anon;

comment on table public.authorized_users is 'Server-managed employee allowlist; no client writes. Rechecked for every protected request.';
comment on table public.feedback_deliveries is 'Appreciation outbox. accepted means provider acceptance, not inbox delivery.';
commit;
