create extension if not exists unaccent with schema extensions;

create or replace function public.get_enrm_catalogue_facets()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'brands', coalesce((select jsonb_agg(value order by value) from (select distinct p.marque as value from public.products p where p.is_published and p.show_on_website) brands), '[]'::jsonb),
    'ranges', coalesce((select jsonb_agg(value order by value) from (select distinct p.gamme as value from public.products p where p.is_published and p.show_on_website and p.gamme <> '') ranges), '[]'::jsonb),
    'viscosities', coalesce((select jsonb_agg(value order by value) from (select distinct p.viscosite as value from public.products p where p.is_published and p.show_on_website and p.viscosite <> '') viscosities), '[]'::jsonb),
    'volumes', coalesce((select jsonb_agg(value order by value) from (select distinct p.litrage as value from public.products p where p.is_published and p.show_on_website and p.litrage <> '') volumes), '[]'::jsonb)
  );
$$;

create or replace function public.get_enrm_catalogue_page(
  p_page integer default 1,
  p_page_size integer default 12,
  p_query text default '',
  p_category_id uuid default null,
  p_brand text default '',
  p_range text default '',
  p_viscosity text default '',
  p_volume text default '',
  p_sort text default 'selection'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_query text;
  v_total bigint;
  v_rows jsonb;
begin
  if p_page is null or p_page < 1 or p_page_size is null or p_page_size not between 1 and 60
     or p_sort not in ('selection', 'price-up', 'price-down', 'name') then
    raise exception 'Paramètres du catalogue invalides.' using errcode = '22023';
  end if;

  v_query := regexp_replace(extensions.unaccent(lower(coalesce(p_query, ''))), '[^a-z0-9]', '', 'g');

  with filtered as materialized (
    select p.*
    from public.products p
    where p.is_published
      and p.show_on_website
      and (p_category_id is null or coalesce(p.category_id, '00000000-0000-4000-8000-000000000001'::uuid) = p_category_id)
      and (coalesce(p_brand, '') = '' or p.marque = p_brand)
      and (coalesce(p_range, '') = '' or p.gamme = p_range)
      and (coalesce(p_viscosity, '') = '' or p.viscosite = p_viscosity)
      and (coalesce(p_volume, '') = '' or p.litrage = p_volume)
      and (
        v_query = ''
        or regexp_replace(extensions.unaccent(lower(concat_ws(' ', p.marque, p.gamme, p.sous_reference, p.viscosite, p.litrage, p.designation, p.references_articles, p.id))), '[^a-z0-9]', '', 'g') like '%' || v_query || '%'
      )
  )
  select count(*) into v_total from filtered;

  with filtered as materialized (
    select p.*
    from public.products p
    where p.is_published
      and p.show_on_website
      and (p_category_id is null or coalesce(p.category_id, '00000000-0000-4000-8000-000000000001'::uuid) = p_category_id)
      and (coalesce(p_brand, '') = '' or p.marque = p_brand)
      and (coalesce(p_range, '') = '' or p.gamme = p_range)
      and (coalesce(p_viscosity, '') = '' or p.viscosite = p_viscosity)
      and (coalesce(p_volume, '') = '' or p.litrage = p_volume)
      and (
        v_query = ''
        or regexp_replace(extensions.unaccent(lower(concat_ws(' ', p.marque, p.gamme, p.sous_reference, p.viscosite, p.litrage, p.designation, p.references_articles, p.id))), '[^a-z0-9]', '', 'g') like '%' || v_query || '%'
      )
  )
  select coalesce(jsonb_agg(to_jsonb(ordered) - 'sort_price_up' - 'sort_price_down' - 'sort_name' order by ordered.sort_price_up asc nulls last, ordered.sort_price_down desc nulls last, ordered.sort_name asc nulls last, ordered.id), '[]'::jsonb)
    into v_rows
  from (
    select filtered.*,
      case when p_sort = 'price-up' then filtered.price end as sort_price_up,
      case when p_sort = 'price-down' then filtered.price end as sort_price_down,
      case when p_sort = 'name' then lower(filtered.marque || ' ' || filtered.sous_reference) end as sort_name
    from filtered
    order by sort_price_up asc nulls last, sort_price_down desc nulls last, sort_name asc nulls last, filtered.id asc
    limit p_page_size offset (p_page - 1) * p_page_size
  ) ordered;

  return jsonb_build_object('page', p_page, 'page_size', p_page_size, 'total', v_total, 'rows', v_rows);
end;
$$;

revoke all on function public.get_enrm_catalogue_facets() from public;
grant execute on function public.get_enrm_catalogue_facets() to anon, authenticated;
revoke all on function public.get_enrm_catalogue_page(integer, integer, text, uuid, text, text, text, text, text) from public;
grant execute on function public.get_enrm_catalogue_page(integer, integer, text, uuid, text, text, text, text, text) to anon, authenticated;
