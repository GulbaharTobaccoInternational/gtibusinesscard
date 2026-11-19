begin;
alter policy "Read own authorization or administer directory" on public.authorized_users
using ((auth_user_id = (select auth.uid()) and status = 'active') or (select private.is_active_admin()));
commit;
