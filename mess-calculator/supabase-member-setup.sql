-- Mess Calculator: one-time member signup + clean demo data
-- Admin auth user: 2fd593f4-379a-4f92-aac6-ad82270aade8

begin;

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

delete from public.user_roles
where user_id <> '2fd593f4-379a-4f92-aac6-ad82270aade8'::uuid;
delete from public.members;

insert into public.user_roles (user_id, member_id, role)
values ('2fd593f4-379a-4f92-aac6-ad82270aade8'::uuid, null, 'admin')
on conflict (user_id) do update
set member_id = null, role = 'admin', updated_at = now();

insert into public.months (name, start_date, opening_balance, is_active)
values ('November 2026', '2026-11-01', 0, true);

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
  display_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));

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
for each row execute function public.handle_new_member_signup();

commit;