begin;
alter table public.authorized_users
  add column password_set_at timestamptz,
  add column setup_email_sent_at timestamptz,
  add column invited_at timestamptz;
comment on column public.authorized_users.password_set_at is 'Observed successful password setup/login in this app. Never a password or hash.';
comment on column public.authorized_users.setup_email_sent_at is 'Most recent accepted setup email request, for invitation/recovery controls; no email history.';
-- Existing IDs, emails, roles, statuses and company permissions are intentionally untouched.
commit;
