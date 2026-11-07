create table public.product_inventory (
  product_id text primary key references public.products(id) on update cascade on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now()
);
alter table public.product_inventory enable row level security;
grant select, insert, update, delete on public.product_inventory to authenticated;
create policy "ENRM admins read inventory" on public.product_inventory
  for select to authenticated using (public.is_enrm_admin());
create policy "ENRM admins create inventory" on public.product_inventory
  for insert to authenticated with check (public.is_enrm_admin());
create policy "ENRM admins update inventory" on public.product_inventory
  for update to authenticated using (public.is_enrm_admin()) with check (public.is_enrm_admin());
create policy "ENRM admins delete inventory" on public.product_inventory
  for delete to authenticated using (public.is_enrm_admin());

create trigger product_inventory_set_updated_at before update on public.product_inventory
for each row execute procedure public.set_updated_at();

create or replace function public.create_product_inventory()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.product_inventory (product_id) values (new.id);
  return new;
end;
$$;
revoke all on function public.create_product_inventory() from public;
create trigger products_create_inventory after insert on public.products
for each row execute procedure public.create_product_inventory();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads ENRM product media" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-media');
create policy "ENRM admins upload product media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-media' and public.is_enrm_admin());
create policy "ENRM admins update product media" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-media' and public.is_enrm_admin())
  with check (bucket_id = 'product-media' and public.is_enrm_admin());
create policy "ENRM admins delete product media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-media' and public.is_enrm_admin());
