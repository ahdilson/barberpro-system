alter table public.establishments add column if not exists slug text not null default '';

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
