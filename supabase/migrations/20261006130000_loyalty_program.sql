-- Migration: Programa de Fidelidade Digital para Barbearias

alter table public.establishments
  add column if not exists loyalty_enabled boolean not null default true,
  add column if not exists loyalty_target integer not null default 10,
  add column if not exists loyalty_reward text not null default '1 Corte de Cabelo Grátis';

alter table public.clients
  add column if not exists loyalty_points integer not null default 0,
  add column if not exists rewards_redeemed integer not null default 0;

-- Função pública para consultar o cartão de fidelidade pelo telefone
create or replace function public.get_client_loyalty(p_establishment uuid, p_phone text)
returns table (
  client_id uuid,
  client_name text,
  client_phone text,
  loyalty_points integer,
  rewards_redeemed integer,
  completed_cuts bigint
)
language sql stable security definer set search_path = public as $$
  select
    c.id as client_id,
    c.name as client_name,
    c.phone as client_phone,
    coalesce(c.loyalty_points, 0) as loyalty_points,
    coalesce(c.rewards_redeemed, 0) as rewards_redeemed,
    (
      select count(*)
      from public.appointments a
      where a.client_id = c.id
        and a.establishment_id = p_establishment
        and a.status = 'concluido'
    ) as completed_cuts
  from public.clients c
  where c.establishment_id = p_establishment
    and regexp_replace(c.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    and length(regexp_replace(p_phone, '\D', '', 'g')) >= 8
  limit 1;
$$;

-- Função para marcar atendimento como concluído e somar pontos de fidelidade
create or replace function public.complete_appointment(p_establishment uuid, p_appointment uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid;
begin
  update public.appointments
  set status = 'concluido'
  where id = p_appointment
    and establishment_id = p_establishment
    and status = 'confirmado'
  returning client_id into v_client_id;

  if v_client_id is not null then
    update public.clients
    set loyalty_points = coalesce(loyalty_points, 0) + 1
    where id = v_client_id and establishment_id = p_establishment;
    return true;
  end if;

  return false;
end;
$$;

-- Função para resgatar o prêmio do cliente
create or replace function public.redeem_client_reward(p_establishment uuid, p_client uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_target integer;
  v_points integer;
begin
  select coalesce(loyalty_target, 10) into v_target
  from public.establishments
  where id = p_establishment;

  select coalesce(loyalty_points, 0) into v_points
  from public.clients
  where id = p_client and establishment_id = p_establishment;

  if v_points >= v_target then
    update public.clients
    set loyalty_points = v_points - v_target,
        rewards_redeemed = coalesce(rewards_redeemed, 0) + 1
    where id = p_client and establishment_id = p_establishment;
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.get_client_loyalty(uuid, text) to anon, authenticated;
grant execute on function public.complete_appointment(uuid, uuid) to anon, authenticated;
grant execute on function public.redeem_client_reward(uuid, uuid) to authenticated;

