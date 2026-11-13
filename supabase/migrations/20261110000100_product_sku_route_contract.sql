create or replace function public.enforce_product_sku_route_format()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' then
    raise exception 'Product SKU must start with a letter or digit and contain only letters, digits, underscores, or hyphens.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_product_sku_route_format() from public, anon, authenticated;

create trigger products_enforce_sku_route_format_insert
before insert on public.products
for each row execute procedure public.enforce_product_sku_route_format();

create trigger products_enforce_sku_route_format_update
before update of id on public.products
for each row
when (old.id is distinct from new.id)
execute procedure public.enforce_product_sku_route_format();
