create or replace function public.save_enrm_product_with_stock(
  p_previous_id text,
  p_product jsonb,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
begin
  if not public.is_enrm_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  if p_product is null
     or p_quantity is null
     or p_quantity < 0
     or p_product ->> 'id' is null
     or length(trim(p_product ->> 'id')) not between 1 and 80 then
    raise exception 'Les informations du produit sont invalides.' using errcode = '22023';
  end if;

  v_product := jsonb_populate_record(null::public.products, p_product);
  if p_previous_id is null then
    insert into public.products (
      id, category_id, marque, gamme, sous_reference, viscosite, litrage,
      designation, price, recto, verso, statut_recto, statut_verso,
      references_articles, reference_image, origine_image, preuves_maroc,
      source_recto, source_verso, url_recto, url_verso, photo_revendeur_url,
      note, is_published, show_on_website
    ) values (
      v_product.id, v_product.category_id, v_product.marque, v_product.gamme,
      v_product.sous_reference, v_product.viscosite, v_product.litrage,
      v_product.designation, v_product.price, v_product.recto, v_product.verso,
      v_product.statut_recto, v_product.statut_verso, v_product.references_articles,
      v_product.reference_image, v_product.origine_image, v_product.preuves_maroc,
      v_product.source_recto, v_product.source_verso, v_product.url_recto,
      v_product.url_verso, v_product.photo_revendeur_url, v_product.note,
      v_product.is_published, v_product.show_on_website
    );
  else
    update public.products set
      id = v_product.id,
      category_id = v_product.category_id,
      marque = v_product.marque,
      gamme = v_product.gamme,
      sous_reference = v_product.sous_reference,
      viscosite = v_product.viscosite,
      litrage = v_product.litrage,
      designation = v_product.designation,
      price = v_product.price,
      recto = v_product.recto,
      verso = v_product.verso,
      statut_recto = v_product.statut_recto,
      statut_verso = v_product.statut_verso,
      references_articles = v_product.references_articles,
      reference_image = v_product.reference_image,
      origine_image = v_product.origine_image,
      preuves_maroc = v_product.preuves_maroc,
      source_recto = v_product.source_recto,
      source_verso = v_product.source_verso,
      url_recto = v_product.url_recto,
      url_verso = v_product.url_verso,
      photo_revendeur_url = v_product.photo_revendeur_url,
      note = v_product.note,
      is_published = v_product.is_published,
      show_on_website = v_product.show_on_website
    where id = p_previous_id;
    if not found then
      raise exception 'Produit introuvable.' using errcode = 'P0002';
    end if;
  end if;

  insert into public.product_inventory (product_id, quantity)
  values (v_product.id, p_quantity)
  on conflict (product_id) do update set quantity = excluded.quantity;
end;
$$;

revoke all on function public.save_enrm_product_with_stock(text, jsonb, integer) from public;
grant execute on function public.save_enrm_product_with_stock(text, jsonb, integer) to authenticated;
