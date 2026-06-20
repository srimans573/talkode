create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('recruiter', 'manager');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.account_status as enum ('active', 'suspended');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruiter_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email text not null unique,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  role public.app_role not null,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

drop trigger if exists recruiter_profiles_set_updated_at on public.recruiter_profiles;
create trigger recruiter_profiles_set_updated_at
before update on public.recruiter_profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_recruiter_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  company_name text;
  display_name text;
  organization_id uuid;
  requested_role text;
begin
  requested_role := new.raw_user_meta_data ->> 'role';

  if requested_role not in ('recruiter', 'manager') then
    raise exception 'Only recruiter and manager accounts can be created.';
  end if;

  company_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), '');
  display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  if company_name is null then
    company_name := split_part(new.email, '@', 2);
  end if;

  if display_name is null then
    display_name := new.email;
  end if;

  insert into public.organizations (name, created_by)
  values (company_name, new.id)
  returning id into organization_id;

  insert into public.recruiter_profiles (
    id,
    organization_id,
    email,
    full_name,
    role
  )
  values (
    new.id,
    organization_id,
    lower(new.email),
    display_name,
    requested_role::public.app_role
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_recruiter_profile on auth.users;
create trigger on_auth_user_created_recruiter_profile
after insert on auth.users
for each row
execute function public.handle_new_recruiter_user();

alter table public.organizations enable row level security;
alter table public.recruiter_profiles enable row level security;

revoke all on public.organizations from anon, authenticated;
revoke all on public.recruiter_profiles from anon, authenticated;

grant select on public.organizations to authenticated;
grant select on public.recruiter_profiles to authenticated;

drop policy if exists "Recruiters can read their organization" on public.organizations;
create policy "Recruiters can read their organization"
on public.organizations
for select
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.recruiter_profiles
    where recruiter_profiles.id = auth.uid()
      and recruiter_profiles.organization_id = organizations.id
  )
);

drop policy if exists "Recruiters can read their own profile" on public.recruiter_profiles;
create policy "Recruiters can read their own profile"
on public.recruiter_profiles
for select
to authenticated
using (id = auth.uid());
