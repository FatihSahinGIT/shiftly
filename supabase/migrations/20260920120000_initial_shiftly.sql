create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'viewer');
create type public.shift_type as enum ('early', 'late', 'night');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 50),
  display_name text not null check (char_length(display_name) between 1 and 80),
  role public.user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  type public.shift_type not null,
  note text check (note is null or char_length(note) <= 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger shifts_set_updated_at before update on public.shifts
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.shifts enable row level security;

create policy "authenticated users can read profiles" on public.profiles
for select to authenticated using (true);

create policy "authenticated users can read shifts" on public.shifts
for select to authenticated using (true);

create policy "admins can insert shifts" on public.shifts
for insert to authenticated with check (public.is_admin() and created_by = auth.uid());

create policy "admins can update shifts" on public.shifts
for update to authenticated using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete shifts" on public.shifts
for delete to authenticated using (public.is_admin());

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.shifts to authenticated;

-- Profile werden bewusst nicht automatisch mit einer frei wählbaren Rolle erzeugt.
-- Lege Auth-Benutzer im Dashboard an und füge Profile mit deren UUID ein:
-- insert into public.profiles (id, username, display_name, role)
-- values ('AUTH-USER-UUID', 'mama', 'Mama', 'admin');
