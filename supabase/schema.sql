create extension if not exists pgcrypto;

create type public.user_role as enum ('platform_admin', 'establishment_admin', 'professional');
create type public.appointment_status as enum ('confirmado', 'cancelado', 'concluido');

create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text not null default 'Barbearia',
  description text not null default '',
  logo_url text,
  phone text not null default '',
  address text not null default '',
  instagram_url text not null default '',
  location_url text not null default '',
  primary_color text not null default '#f59e0b',
  whatsapp text not null default '',
  confirmation_message text not null default '',
  reminder_message text not null default '',
  reminder_minutes integer not null default 60,
  reminder_enabled boolean not null default true,
  online_booking_enabled boolean not null default true,
  service_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  establishment_id uuid references public.establishments(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'professional',
  photo_url text,
  commission numeric(5,2) not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  duration_minutes integer not null default 30,
  category text not null default 'Geral',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  unique (establishment_id, phone)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  professional_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  appointment_date date not null,
  appointment_time time not null,
  status public.appointment_status not null default 'confirmado',
  payment_method text not null default 'pendente',
  created_at timestamptz not null default now()
);

create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  reason text not null default '',
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.establishments enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.time_blocks enable row level security;

create or replace function public.is_establishment_member(target_establishment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and establishment_id = target_establishment and active = true
  );
$$;

create policy "public can view active establishment" on public.establishments
  for select using (service_enabled = true);
create policy "members manage own establishment" on public.establishments
  for all using (public.is_establishment_member(id))
  with check (public.is_establishment_member(id));

create policy "members view profiles" on public.profiles
  for select using (public.is_establishment_member(establishment_id));
create policy "admins manage profiles" on public.profiles
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.establishment_id = profiles.establishment_id and p.role = 'establishment_admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.establishment_id = profiles.establishment_id and p.role = 'establishment_admin'));

create policy "public can view active services" on public.services
  for select using (active = true and exists (select 1 from public.establishments e where e.id = establishment_id and e.service_enabled = true));
create policy "members manage services" on public.services
  for all using (public.is_establishment_member(establishment_id))
  with check (public.is_establishment_member(establishment_id));

create policy "members manage clients" on public.clients
  for all using (public.is_establishment_member(establishment_id))
  with check (public.is_establishment_member(establishment_id));
create policy "members manage appointments" on public.appointments
  for all using (public.is_establishment_member(establishment_id))
  with check (public.is_establishment_member(establishment_id));
create policy "members manage time blocks" on public.time_blocks
  for all using (public.is_establishment_member(establishment_id))
  with check (public.is_establishment_member(establishment_id));

insert into storage.buckets (id, name, public) values ('establishment-assets', 'establishment-assets', true)
on conflict (id) do nothing;
