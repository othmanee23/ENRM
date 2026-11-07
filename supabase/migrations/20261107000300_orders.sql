create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  request_id uuid not null unique,
  order_number text not null unique,
  customer_name text not null check (length(trim(customer_name)) between 2 and 120),
  phone text not null check (length(trim(phone)) between 6 and 30),
  city text not null check (length(trim(city)) between 2 and 100),
  delivery_address text not null check (length(trim(delivery_address)) between 5 and 300),
  status text not null default 'À préparer'
    check (status in ('À préparer', 'En préparation', 'Expédiée', 'Livrée', 'Annulée')),
  payment_status text not null default 'À encaisser'
    check (payment_status in ('À encaisser', 'Payée')),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);
create index orders_recent on public.orders (created_at desc);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  volume text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);
create index order_items_by_order on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
grant select on public.orders, public.order_items to authenticated;
create policy "ENRM admins read orders" on public.orders
  for select to authenticated using (public.is_enrm_admin());
create policy "ENRM admins read order items" on public.order_items
  for select to authenticated using (public.is_enrm_admin());
revoke all on public.orders, public.order_items from anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
revoke all on sequence public.order_number_seq from public, anon, authenticated;

create or replace function public.place_enrm_order(
  p_customer_name text,
  p_phone text,
  p_city text,
  p_delivery_address text,
  p_items jsonb,
  p_request_id uuid
)
returns table (order_number text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_total numeric(12, 2);
  v_item record;
  v_product record;
begin
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120
     or length(trim(coalesce(p_phone, ''))) not between 6 and 30
     or length(trim(coalesce(p_city, ''))) not between 2 and 100
     or length(trim(coalesce(p_delivery_address, ''))) not between 5 and 300 then
    raise exception 'Veuillez vérifier les coordonnées de livraison.' using errcode = '22023';
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
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Le panier est invalide.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(id text, qty integer)
    group by item.id
    having count(*) > 1
  ) or exists (
    select 1 from jsonb_to_recordset(p_items) as item(id text, qty integer)
    where item.id is null or length(item.id) > 80 or item.qty is null or item.qty not between 1 and 99
  ) then
    raise exception 'Le panier est invalide.' using errcode = '22023';
  end if;

  perform inventory.product_id
  from public.product_inventory as inventory
  join public.products as product on product.id = inventory.product_id
  join public.categories as category on category.id = product.category_id
  join jsonb_to_recordset(p_items) as item(id text, qty integer) on item.id = product.id
  where product.is_published and product.show_on_website and category.is_active
  order by inventory.product_id
  for update of inventory;

  for v_item in select id, qty from jsonb_to_recordset(p_items) as item(id text, qty integer)
  loop
    select product.id, product.marque, product.sous_reference, product.viscosite,
           product.litrage, product.price, inventory.quantity
      into v_product
      from public.products as product
      join public.categories as category on category.id = product.category_id
      join public.product_inventory as inventory on inventory.product_id = product.id
     where product.id = v_item.id
       and product.is_published and product.show_on_website and category.is_active;
    if not found then
      raise exception 'Un produit n’est plus disponible.' using errcode = 'P0001';
    end if;
    if v_product.quantity < v_item.qty then
      raise exception 'Stock insuffisant pour %.', v_product.id using errcode = 'P0001';
    end if;
  end loop;

  select sum(product.price * item.qty)::numeric(12, 2)
    into v_total
    from jsonb_to_recordset(p_items) as item(id text, qty integer)
    join public.products as product on product.id = item.id
    join public.categories as category on category.id = product.category_id
   where product.is_published and product.show_on_website and category.is_active;

  v_order_number := 'EN-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  insert into public.orders (
    request_id, order_number, customer_name, phone, city, delivery_address, total
  ) values (
    p_request_id, v_order_number, trim(p_customer_name), trim(p_phone), trim(p_city), trim(p_delivery_address), v_total
  ) returning id into v_order_id;

  for v_item in select id, qty from jsonb_to_recordset(p_items) as item(id text, qty integer)
  loop
    select product.id, product.marque, product.sous_reference, product.viscosite,
           product.litrage, product.price
      into v_product
      from public.products as product
     where product.id = v_item.id;
    insert into public.order_items (
      order_id, product_id, product_name, volume, quantity, unit_price, line_total
    ) values (
      v_order_id,
      v_product.id,
      concat_ws(' ', v_product.marque, v_product.sous_reference, v_product.viscosite),
      v_product.litrage,
      v_item.qty,
      v_product.price,
      v_product.price * v_item.qty
    );
    update public.product_inventory
       set quantity = quantity - v_item.qty
     where product_id = v_product.id;
  end loop;

  return query select v_order_number, v_total;
end;
$$;
revoke all on function public.place_enrm_order(text, text, text, text, jsonb, uuid) from public;
grant execute on function public.place_enrm_order(text, text, text, text, jsonb, uuid) to anon, authenticated;
