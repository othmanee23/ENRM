-- Add manufacturer-confirmed Valvoline hybrid passenger-car engine oils as
-- unpublished drafts until ENRM validates packshots and local availability.
with valvoline_products (
  id, marque, gamme, sous_reference, viscosite, litrage, designation,
  references_articles, source_recto, note
) as (
  values
    ('ENRM-HM-VAL-HYB-C5-0W20-1L', 'Valvoline', 'Hybrid', 'HYBRID C5', '0W-20', '1 L', 'Valvoline Hybrid C5 0W-20', 'Réf. fabricant 892409 | EAN 8710941032818', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C5-0W20-5L', 'Valvoline', 'Hybrid', 'HYBRID C5', '0W-20', '5 L', 'Valvoline Hybrid C5 0W-20', 'Réf. fabricant 892410 | EAN 8710941032825', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C5-0W20-20L', 'Valvoline', 'Hybrid', 'HYBRID C5', '0W-20', '20 L', 'Valvoline Hybrid C5 0W-20', 'Réf. fabricant 892442 | EAN 8710941032832', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C2-5W30-1L', 'Valvoline', 'Hybrid', 'HYBRID C2', '5W-30', '1 L', 'Valvoline Hybrid C2 5W-30', 'Réf. fabricant 892443 | EAN 8710941032849', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C2-5W30-5L', 'Valvoline', 'Hybrid', 'HYBRID C2', '5W-30', '5 L', 'Valvoline Hybrid C2 5W-30', 'Réf. fabricant 892444 | EAN 8710941032856', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C2-5W30-20L', 'Valvoline', 'Hybrid', 'HYBRID C2', '5W-30', '20 L', 'Valvoline Hybrid C2 5W-30', 'Réf. fabricant 892445 | EAN 8710941032863', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C3-5W30-1L', 'Valvoline', 'Hybrid', 'HYBRID C3', '5W-30', '1 L', 'Valvoline Hybrid C3 5W-30', 'Réf. fabricant 892447 | EAN 8710941032870', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C3-5W30-5L', 'Valvoline', 'Hybrid', 'HYBRID C3', '5W-30', '5 L', 'Valvoline Hybrid C3 5W-30', 'Réf. fabricant 892448 | EAN 8710941032887', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.'),
    ('ENRM-HM-VAL-HYB-C3-5W30-20L', 'Valvoline', 'Hybrid', 'HYBRID C3', '5W-30', '20 L', 'Valvoline Hybrid C3 5W-30', 'Réf. fabricant 892449 | EAN 8710941032894', 'https://www.valvolineglobal.com/fr-fr/hybrid-vehicle-products/', 'Référence et conditionnement confirmés sur la gamme officielle Valvoline France. Packshot fabricant et disponibilité Maroc à valider avec le client. Brouillon jusqu’à validation.')
), inserted as (
  insert into public.products (
    id, category_id, marque, gamme, sous_reference, viscosite, litrage,
    designation, price, recto, verso, statut_recto, statut_verso,
    references_articles, reference_image, origine_image, preuves_maroc,
    source_recto, source_verso, url_recto, url_verso, photo_revendeur_url,
    note, is_published, show_on_website
  )
  select
    p.id, '00000000-0000-4000-8000-000000000001', p.marque, p.gamme,
    p.sous_reference, p.viscosite, p.litrage, p.designation, 0, '', '',
    'À valider', 'À obtenir', p.references_articles, '', 'Fabricant', '',
    p.source_recto, '', '', '', '', p.note, false, false
  from valvoline_products p
  on conflict (id) do nothing
  returning id
)
insert into public.product_inventory (product_id, quantity)
select id, 100 from inserted
on conflict (product_id) do nothing;
