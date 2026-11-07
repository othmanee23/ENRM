alter function public.place_enrm_order(text, text, text, text, jsonb, uuid)
  rename to place_enrm_order_internal;
revoke all on function public.place_enrm_order_internal(text, text, text, text, jsonb, uuid)
  from public, anon, authenticated;

create table public.order_request_limits (
  phone_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);
alter table public.order_request_limits enable row level security;
revoke all on public.order_request_limits from public, anon, authenticated;

create or replace function public.place_enrm_order(
  p_customer_name text,
  p_phone text,
  p_city text,
  p_delivery_address text,
  p_items jsonb,
  p_request_id uuid,
  p_website text
)
returns table (order_number text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone_digits text;
  v_phone_hash text;
  v_request_count integer;
begin
  if length(trim(coalesce(p_website, ''))) > 0 then
    return;
  end if;
  v_phone_digits := pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone_digits) not between 6 and 15 then
    raise exception 'Veuillez vérifier votre numéro de téléphone.' using errcode = '22023';
  end if;
  if p_request_id is null then
    raise exception 'La demande de commande est invalide.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text, 0));
  return query
    select existing.order_number, existing.total
      from public.orders as existing
     where existing.request_id = p_request_id;
  if found then
    return;
  end if;

  v_phone_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(v_phone_digits, 'UTF8'), 'sha256'),
    'hex'
  );
  insert into public.order_request_limits as limits (phone_hash, window_started_at, request_count)
  values (v_phone_hash, now(), 1)
  on conflict (phone_hash) do update
    set window_started_at = case
          when limits.window_started_at <= now() - interval '1 hour' then now()
          else limits.window_started_at
        end,
        request_count = case
          when limits.window_started_at <= now() - interval '1 hour' then 1
          else limits.request_count + 1
        end
  returning request_count into v_request_count;

  if v_request_count > 3 then
    return;
  end if;

  return query
    select placed.order_number, placed.total
      from public.place_enrm_order_internal(
        p_customer_name,
        p_phone,
        p_city,
        p_delivery_address,
        p_items,
        p_request_id
      ) as placed;
end;
$$;
revoke all on function public.place_enrm_order(text, text, text, text, jsonb, uuid, text) from public;
grant execute on function public.place_enrm_order(text, text, text, text, jsonb, uuid, text) to anon, authenticated;
