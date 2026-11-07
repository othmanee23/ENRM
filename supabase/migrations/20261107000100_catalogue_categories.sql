create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_enrm_admin()
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_enrm_admin() from public;
grant execute on function public.is_enrm_admin() to anon, authenticated;

create or replace function public.handle_new_enrm_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_enrm_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_enrm_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create index categories_navigation on public.categories (parent_id, sort_order, name) where is_active;

create table public.products (
  id text primary key check (length(trim(id)) between 1 and 80),
  category_id uuid not null references public.categories(id) on delete restrict,
  marque text not null default '',
  gamme text not null default '',
  sous_reference text not null default '',
  viscosite text not null default '',
  litrage text not null default '',
  designation text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  recto text not null default '',
  verso text not null default '',
  statut_recto text not null default '',
  statut_verso text not null default '',
  references_articles text not null default '',
  reference_image text not null default '',
  origine_image text not null default '',
  preuves_maroc text not null default '',
  source_recto text not null default '',
  source_verso text not null default '',
  url_recto text not null default '',
  url_verso text not null default '',
  photo_revendeur_url text not null default '',
  note text not null default '',
  is_published boolean not null default false,
  show_on_website boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_public_listing on public.products (category_id, marque, id)
  where is_published and show_on_website;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.profiles to authenticated;

create policy "read own ENRM profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_enrm_admin());

create policy "public reads active categories" on public.categories
  for select to anon, authenticated
  using (is_active or public.is_enrm_admin());
create policy "admins insert categories" on public.categories
  for insert to authenticated with check (public.is_enrm_admin());
create policy "admins update categories" on public.categories
  for update to authenticated using (public.is_enrm_admin()) with check (public.is_enrm_admin());
create policy "admins delete unused categories" on public.categories
  for delete to authenticated using (public.is_enrm_admin());

create policy "public reads published products in active categories" on public.products
  for select to anon, authenticated
  using (
    (is_published and show_on_website and exists (
      select 1 from public.categories c where c.id = category_id and c.is_active
    )) or public.is_enrm_admin()
  );
create policy "admins insert products" on public.products
  for insert to authenticated with check (public.is_enrm_admin());
create policy "admins update products" on public.products
  for update to authenticated using (public.is_enrm_admin()) with check (public.is_enrm_admin());
create policy "admins delete products" on public.products
  for delete to authenticated using (public.is_enrm_admin());

insert into public.categories (id, name, slug, sort_order)
values ('00000000-0000-4000-8000-000000000001', 'Huiles moteur', 'huiles-moteur', 10);

create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at before update on public.categories
for each row execute procedure public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute procedure public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();
