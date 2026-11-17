-- Expose availability only; inventory counts and the inventory table remain private.
create or replace view public.public_product_availability
with (security_barrier = true)
as
  select
    product.id as product_id,
    coalesce(inventory.quantity, 0) > 0 as in_stock
  from public.products as product
  left join public.product_inventory as inventory
    on inventory.product_id = product.id
  left join public.categories as category
    on category.id = product.category_id
  where product.is_published
    and product.show_on_website
    and (product.category_id is null or category.is_active);

revoke all on public.public_product_availability from public, anon, authenticated;
grant select on public.public_product_availability to anon, authenticated;
