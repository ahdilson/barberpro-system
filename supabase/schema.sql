create extension if not exists pgcrypto;

create type public.user_role as enum ('platform_admin', 'establishment_admin', 'professional');
create type public.appointment_status as enum ('confirmado', 'cancelado', 'concluido');

create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null default '',
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

create unique index if not exists establishments_slug_unique
  on public.establishments (slug) where slug <> '';

create or replace function public.list_public_professionals(p_establishment uuid)
returns table (id uuid, full_name text, photo_url text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.photo_url
  from public.profiles p
  join public.establishments e on e.id = p.establishment_id
  where p.establishment_id = p_establishment
    and p.active = true
    and p.role in ('professional', 'establishment_admin')
    and e.service_enabled = true;
$$;

create or replace function public.list_public_busy(p_establishment uuid)
returns table (professional_id uuid, appointment_date date, appointment_time time, duration_minutes integer)
language sql stable security definer set search_path = public as $$
  select a.professional_id, a.appointment_date, a.appointment_time, s.duration_minutes
  from public.appointments a
  join public.services s on s.id = a.service_id
  join public.establishments e on e.id = a.establishment_id
  where a.establishment_id = p_establishment
    and a.status = 'confirmado'
    and e.service_enabled = true;
$$;

create or replace function public.list_public_blocks(p_establishment uuid)
returns table (id uuid, professional_id uuid, block_date date, start_time time, end_time time, is_recurring boolean, reason text)
language sql stable security definer set search_path = public as $$
  select b.id, b.professional_id, b.block_date, b.start_time, b.end_time, b.is_recurring, b.reason
  from public.time_blocks b
  join public.establishments e on e.id = b.establishment_id
  where b.establishment_id = p_establishment and e.service_enabled = true;
$$;

create or replace function public.book_public_appointment(
  p_establishment uuid,
  p_professional uuid,
  p_service uuid,
  p_date date,
  p_time time,
  p_name text,
  p_phone text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_client uuid;
  v_id uuid;
  v_duration integer;
  v_end time;
begin
  if length(trim(p_name)) < 2 or length(regexp_replace(p_phone, '\D', '', 'g')) < 8 then
    raise exception 'Informe nome e telefone válidos.';
  end if;
  if not exists (
    select 1 from public.establishments e
    where e.id = p_establishment and e.service_enabled and e.online_booking_enabled
  ) then
    raise exception 'Agendamento online indisponível.';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_professional and p.establishment_id = p_establishment and p.active
      and p.role in ('professional', 'establishment_admin')
  ) then
    raise exception 'Profissional indisponível.';
  end if;
  select duration_minutes into v_duration from public.services
  where id = p_service and establishment_id = p_establishment and active;
  if v_duration is null then
    raise exception 'Serviço indisponível.';
  end if;
  v_end := (p_time + make_interval(mins => v_duration))::time;
  if exists (
    select 1 from public.appointments a
    join public.services s on s.id = a.service_id
    where a.establishment_id = p_establishment
      and a.professional_id = p_professional
      and a.appointment_date = p_date
      and a.status = 'confirmado'
      and p_time < (a.appointment_time + make_interval(mins => s.duration_minutes))::time
      and v_end > a.appointment_time
  ) or exists (
    select 1 from public.time_blocks b
    where b.establishment_id = p_establishment
      and b.professional_id = p_professional
      and (b.is_recurring or b.block_date = p_date)
      and p_time < b.end_time and v_end > b.start_time
  ) then
    raise exception 'Este horário não está mais disponível.';
  end if;

  insert into public.clients (establishment_id, name, phone)
  values (p_establishment, trim(p_name), trim(p_phone))
  on conflict (establishment_id, phone) do update set name = excluded.name
  returning id into v_client;

  insert into public.appointments (
    establishment_id, client_id, professional_id, service_id,
    appointment_date, appointment_time, status, payment_method
  ) values (
    p_establishment, v_client, p_professional, p_service,
    p_date, p_time, 'confirmado', 'pendente'
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.lookup_my_appointments(p_establishment uuid, p_phone text)
returns table (
  id uuid,
  client_name text,
  client_phone text,
  professional_id uuid,
  service_id uuid,
  appointment_date date,
  appointment_time time,
  duration_minutes integer,
  price numeric,
  payment_method text,
  status public.appointment_status
)
language sql stable security definer set search_path = public as $$
  select a.id, c.name, c.phone, a.professional_id, a.service_id,
         a.appointment_date, a.appointment_time, s.duration_minutes, s.price,
         a.payment_method, a.status
  from public.appointments a
  join public.clients c on c.id = a.client_id
  join public.services s on s.id = a.service_id
  where a.establishment_id = p_establishment
    and regexp_replace(c.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    and length(regexp_replace(p_phone, '\D', '', 'g')) >= 8;
$$;

create or replace function public.cancel_public_appointment(p_establishment uuid, p_appointment uuid, p_phone text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_updated integer;
begin
  update public.appointments a
  set status = 'cancelado'
  from public.clients c
  where a.id = p_appointment
    and a.establishment_id = p_establishment
    and a.client_id = c.id
    and a.status = 'confirmado'
    and regexp_replace(c.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    and length(regexp_replace(p_phone, '\D', '', 'g')) >= 8;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.list_public_professionals(uuid) to anon, authenticated;
grant execute on function public.list_public_busy(uuid) to anon, authenticated;
grant execute on function public.list_public_blocks(uuid) to anon, authenticated;
grant execute on function public.book_public_appointment(uuid, uuid, uuid, date, time, text, text) to anon, authenticated;
grant execute on function public.lookup_my_appointments(uuid, text) to anon, authenticated;
grant execute on function public.cancel_public_appointment(uuid, uuid, text) to anon, authenticated;
