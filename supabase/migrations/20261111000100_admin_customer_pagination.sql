create or replace function public.list_enrm_admin_customers(
  p_page integer default 1,
  p_page_size integer default 12,
  p_query text default ''
)
returns table (
  id text,
  name text,
  city text,
  phone text,
  delivery_address text,
  request_count bigint,
  subtotal numeric,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_enrm_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  if p_page is null or p_page < 1 or p_page_size is null or p_page_size not between 1 and 100 then
    raise exception 'Pagination invalide.' using errcode = '22023';
  end if;

  return query
  with normalized as (
    select
      orders.*,
      case
        when regexp_replace(orders.phone, '[^0-9]', '', 'g') <> ''
          then 'phone:' || regexp_replace(orders.phone, '[^0-9]', '', 'g')
        else 'name-city:' || lower(trim(orders.customer_name)) || '|' || lower(trim(orders.city))
      end as customer_key
    from public.orders as orders
  ), grouped as (
    select
      normalized.customer_key,
      (array_agg(normalized.customer_name order by normalized.created_at desc))[1] as customer_name,
      (array_agg(normalized.city order by normalized.created_at desc))[1] as customer_city,
      (array_agg(normalized.phone order by normalized.created_at desc))[1] as customer_phone,
      (array_agg(normalized.delivery_address order by normalized.created_at desc))[1] as customer_address,
      count(*)::bigint as customer_request_count,
      coalesce(sum(normalized.total) filter (where normalized.status <> 'Annulée'), 0)::numeric as customer_subtotal,
      max(normalized.created_at) as last_request
    from normalized
    group by normalized.customer_key
  ), filtered as (
    select grouped.*
    from grouped
    where coalesce(p_query, '') = ''
       or grouped.customer_name ilike '%' || p_query || '%'
       or grouped.customer_city ilike '%' || p_query || '%'
       or grouped.customer_phone ilike '%' || p_query || '%'
  ), counted as (
    select filtered.*, count(*) over() as matching_count from filtered
  )
  select
    counted.customer_key,
    counted.customer_name,
    counted.customer_city,
    counted.customer_phone,
    counted.customer_address,
    counted.customer_request_count,
    counted.customer_subtotal,
    counted.matching_count
  from counted
  order by counted.last_request desc, counted.customer_key
  limit p_page_size
  offset (p_page - 1) * p_page_size;
end;
$$;

create or replace function public.list_enrm_admin_products(
  p_page integer default 1,
  p_page_size integer default 12,
  p_query text default '',
  p_filter text default 'Tous'
)
returns table (product jsonb, quantity integer, total_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_enrm_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  if p_page is null or p_page < 1 or p_page_size is null or p_page_size not between 1 and 100
     or p_filter not in ('Tous', 'Actif', 'Brouillon', 'Stock faible', 'Rupture') then
    raise exception 'Pagination ou filtre invalide.' using errcode = '22023';
  end if;

  return query
  with filtered as (
    select products.*, coalesce(inventory.quantity, 0) as stock_quantity
    from public.products as products
    left join public.product_inventory as inventory on inventory.product_id = products.id
    where (
      coalesce(p_query, '') = ''
      or products.id ilike '%' || p_query || '%'
      or products.marque ilike '%' || p_query || '%'
      or products.gamme ilike '%' || p_query || '%'
      or products.sous_reference ilike '%' || p_query || '%'
      or products.viscosite ilike '%' || p_query || '%'
      or products.litrage ilike '%' || p_query || '%'
      or products.designation ilike '%' || p_query || '%'
    ) and (
      p_filter = 'Tous'
      or (p_filter = 'Actif' and products.is_published)
      or (p_filter = 'Brouillon' and not products.is_published)
      or (p_filter = 'Stock faible' and coalesce(inventory.quantity, 0) between 0 and 10)
      or (p_filter = 'Rupture' and coalesce(inventory.quantity, 0) = 0)
    )
  ), counted as (
    select filtered.*, count(*) over() as matching_count from filtered
  )
  select to_jsonb(counted.*) - 'stock_quantity' - 'matching_count',
         counted.stock_quantity,
         counted.matching_count
  from counted
  order by counted.id
  limit p_page_size
  offset (p_page - 1) * p_page_size;
end;
$$;

revoke all on function public.list_enrm_admin_customers(integer, integer, text) from public, anon;
grant execute on function public.list_enrm_admin_customers(integer, integer, text) to authenticated;
revoke all on function public.list_enrm_admin_products(integer, integer, text, text) from public, anon;
grant execute on function public.list_enrm_admin_products(integer, integer, text, text) to authenticated;
