-- MESS CALCULATOR: FINAL CLEAN RESET
-- Keeps ONLY the Admin Auth account.
-- Admin UID: 2fd593f4-379a-4f92-aac6-ad82270aade8
-- Run this once in Supabase SQL Editor.

begin;

-- 1) Remove all app transaction/data rows first.
delete from public.notifications;
delete from public.expense_shares;
delete from public.meals;
delete from public.expenses;
delete from public.deposits;
delete from public.withdrawals;
delete from public.transfers;
delete from public.default_menu;
delete from public.mess_settings;
delete from public.months;

-- 2) Remove all non-admin roles and members.
delete from public.user_roles
where user_id <> '2fd593f4-379a-4f92-aac6-ad82270aade8'::uuid;

delete from public.members;

-- 3) Remove every old Supabase Auth user except the Admin.
-- The Supabase SQL Editor runs with database-owner privileges.
delete from auth.users
where id <> '2fd593f4-379a-4f92-aac6-ad82270aade8'::uuid;

-- 4) Re-create/repair the Admin role.
insert into public.user_roles (user_id, member_id, role)
values ('2fd593f4-379a-4f92-aac6-ad82270aade8'::uuid, null, 'admin')
on conflict (user_id) do update
set member_id = null,
    role = 'admin',
    updated_at = now();

-- 5) Ensure the automatic new-member signup trigger exists.
create or replace function public.handle_new_member_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_member_id uuid;
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.members (name, email, auth_user_id, is_active)
  values (display_name, lower(new.email), new.id, true)
  returning id into new_member_id;

  insert into public.user_roles (user_id, member_id, role)
  values (new.id, new_member_id, 'member')
  on conflict (user_id) do update
    set member_id = excluded.member_id,
        role = 'member',
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_member on auth.users;

create trigger on_auth_user_created_member
after insert on auth.users
for each row
execute function public.handle_new_member_signup();

-- 6) Start with one clean active month.
insert into public.months (name, start_date, opening_balance, is_active)
values ('November 2026', '2026-11-01', 0, true);

commit;

-- Verification:
-- SELECT id, email FROM auth.users ORDER BY created_at;
-- SELECT user_id, member_id, role FROM public.user_roles;
-- SELECT id, name, email, auth_user_id FROM public.members;
-- SELECT name, start_date, opening_balance, is_active FROM public.months;
