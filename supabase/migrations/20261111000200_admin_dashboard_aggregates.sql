create or replace function public.get_enrm_admin_dashboard(
  p_days integer default 30,
  p_until timestamptz default now(),
  p_stock_threshold integer default 10
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_bucket interval;
  v_result jsonb;
begin
  if not public.is_enrm_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  if p_days not in (7, 30, 90) or p_stock_threshold is null or p_stock_threshold not between 0 and 9999 then
    raise exception 'Paramètres du tableau de bord invalides.' using errcode = '22023';
  end if;

  v_start := p_until - make_interval(days => p_days - 1);
  v_bucket := make_interval(secs => greatest(extract(epoch from (p_until - v_start)) / 7, 1));

  select jsonb_build_object(
    'period_days', p_days,
    'period_order_count', (select count(*) from public.orders o where o.created_at >= v_start and o.created_at <= p_until),
    'period_active_order_count', (select count(*) from public.orders o where o.created_at >= v_start and o.created_at <= p_until and o.status <> 'Annulée'),
    'period_revenue', coalesce((select sum(o.total) from public.orders o where o.created_at >= v_start and o.created_at <= p_until and o.status <> 'Annulée'), 0),
    'period_average', coalesce((select avg(o.total) from public.orders o where o.created_at >= v_start and o.created_at <= p_until and o.status <> 'Annulée'), 0),
    'period_customer_count', (select count(distinct case when regexp_replace(o.phone, '[^0-9]', '', 'g') <> '' then 'phone:' || regexp_replace(o.phone, '[^0-9]', '', 'g') else 'name-city:' || lower(trim(o.customer_name)) || '|' || lower(trim(o.city)) end) from public.orders o where o.created_at >= v_start and o.created_at <= p_until),
    'total_order_count', (select count(*) from public.orders),
    'pending_order_count', (select count(*) from public.orders o where o.status in ('À confirmer', 'À préparer', 'En préparation')),
    'awaiting_contact_count', (select count(*) from public.orders o where o.status = 'À confirmer'),
    'total_customer_count', (select count(distinct case when regexp_replace(o.phone, '[^0-9]', '', 'g') <> '' then 'phone:' || regexp_replace(o.phone, '[^0-9]', '', 'g') else 'name-city:' || lower(trim(o.customer_name)) || '|' || lower(trim(o.city)) end) from public.orders o),
    'total_product_count', (select count(*) from public.products),
    'low_stock_count', (select count(*) from public.products p left join public.product_inventory i on i.product_id = p.id where p.is_published and coalesce(i.quantity, 0) <= p_stock_threshold),
    'out_of_stock_count', (select count(*) from public.products p left join public.product_inventory i on i.product_id = p.id where p.is_published and coalesce(i.quantity, 0) = 0),
    'daily_revenue', coalesce((
      select jsonb_agg(jsonb_build_object('revenue', coalesce(bucket_total.revenue, 0)) order by buckets.bucket)
      from generate_series(0, 6) as buckets(bucket)
      left join lateral (
        select sum(o.total) as revenue
        from public.orders o
        where o.status <> 'Annulée'
          and o.created_at >= v_start + v_bucket * buckets.bucket
          and (buckets.bucket = 6 and o.created_at <= p_until or buckets.bucket < 6 and o.created_at < v_start + v_bucket * (buckets.bucket + 1))
      ) as bucket_total on true
    ), '[]'::jsonb),
    'status_counts', coalesce((
      select jsonb_agg(jsonb_build_object('status', statuses.status, 'count', coalesce(status_totals.total, 0)) order by statuses.ordinal)
      from (values (1, 'À confirmer'), (2, 'À préparer'), (3, 'En préparation'), (4, 'Expédiée'), (5, 'Livrée'), (6, 'Annulée')) as statuses(ordinal, status)
      left join (
        select o.status, count(*) as total from public.orders o where o.created_at >= v_start and o.created_at <= p_until group by o.status
      ) status_totals on status_totals.status = statuses.status
    ), '[]'::jsonb),
    'cities', coalesce((
      select jsonb_agg(jsonb_build_object('city', city_totals.city, 'order_count', city_totals.order_count, 'subtotal', city_totals.subtotal) order by city_totals.subtotal desc)
      from (
        select o.city, count(*) as order_count, coalesce(sum(o.total) filter (where o.status <> 'Annulée'), 0) as subtotal
        from public.orders o where o.created_at >= v_start and o.created_at <= p_until
        group by o.city order by subtotal desc limit 6
      ) city_totals
    ), '[]'::jsonb),
    'best_products', coalesce((
      select jsonb_agg(jsonb_build_object('id', items.product_id, 'name', items.product_name, 'volume', items.volume, 'quantity', items.quantity, 'subtotal', items.subtotal) order by items.quantity desc, items.product_id)
      from (
        select oi.product_id, oi.product_name, oi.volume, sum(oi.quantity)::integer as quantity,
          sum(oi.unit_price * oi.quantity) filter (where o.status <> 'Annulée') as subtotal
        from public.order_items oi join public.orders o on o.id = oi.order_id
        where o.created_at >= v_start and o.created_at <= p_until and o.status <> 'Annulée'
        group by oi.product_id, oi.product_name, oi.volume
        order by quantity desc, oi.product_id limit 4
      ) items
    ), '[]'::jsonb),
    'recent_orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', recent.id, 'order_number', recent.order_number, 'customer_name', recent.customer_name,
        'phone', recent.phone, 'city', recent.city, 'delivery_address', recent.delivery_address,
        'status', recent.status, 'tracking_number', recent.tracking_number, 'internal_note', recent.internal_note,
        'created_at', recent.created_at,
        'order_items', coalesce((select jsonb_agg(jsonb_build_object('product_id', oi.product_id, 'product_name', oi.product_name, 'volume', oi.volume, 'quantity', oi.quantity, 'unit_price', oi.unit_price) order by oi.id) from public.order_items oi where oi.order_id = recent.id), '[]'::jsonb),
        'status_history', coalesce((select jsonb_agg(jsonb_build_object('previous_status', h.previous_status, 'status', h.status, 'created_at', h.created_at) order by h.created_at, h.id) from public.order_status_history h where h.order_id = recent.id), '[]'::jsonb)
      ) order by recent.created_at desc, recent.id desc)
      from (select o.* from public.orders o order by o.created_at desc, o.id desc limit 5) recent
    ), '[]'::jsonb),
    'low_stock_products', coalesce((
      select jsonb_agg(jsonb_build_object('product', to_jsonb(low.product), 'quantity', low.quantity) order by low.quantity, low.id)
      from (
        select p.id, p as product, coalesce(i.quantity, 0) as quantity
        from public.products p left join public.product_inventory i on i.product_id = p.id
        where p.is_published and coalesce(i.quantity, 0) <= p_stock_threshold
        order by coalesce(i.quantity, 0), p.id limit 3
      ) low
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_enrm_admin_dashboard(integer, timestamptz, integer) from public, anon;
grant execute on function public.get_enrm_admin_dashboard(integer, timestamptz, integer) to authenticated;
