-- Replace published catalogue images that were watermarked, black-backed,
-- too soft, or used brand artwork instead of a product packshot.
update public.products as p
set recto = v.recto,
    url_recto = v.recto,
    statut_recto = 'Packshot vérifié',
    origine_image = v.origine_image,
    source_recto = v.source_recto,
    note = v.note,
    updated_at = now()
from (values
  ('ENRM-HM-002', 'https://www.castrol.com/content/dam/castrol/master-site/en/global-ia/home/europe/images/products/edge-0w20-c5.png', 'https://www.castrol.com/en/global/home/products/our-brands/automotive/castrol-edge-oils.html', 'Fabricant', 'Packshot recto Castrol EDGE 0W-20 C5 5 L de face, sans filigrane. Image fabricant.'),
  ('ENRM-HM-010', 'https://www.castrol.com/content/dam/castrol/country-sites-new/en_za/south_africa/home/images/products/automotive/edge/edge-5w30-ll.png', 'https://www.castrol.com/en_au/australia/home/products/our-brands/automotive/castrol-edge-oils.html', 'Fabricant', 'Packshot recto Castrol EDGE 5W-30 LL 5 L de face, fond clair, sans watermark. Image fabricant.'),
  ('ENRM-HM-130', 'https://cdn.media.halfords.com/i/washford/224947/Shell-Helix-HX5-15W-40?fmt=auto&h=555&qlt=default&v=1&w=740', 'https://www.halfords.com/motoring/engine-oils-and-fluids/engine-oil/shell-helix-hx5-15w-40-224947.html', 'Revendeur', 'Packshot recto Shell Helix HX5 15W-40 1 L de face sur fond blanc, résolution supérieure.'),
  ('ENRM-HM-137', 'https://vektoravto71.ru/upload/iblock/e75/v8a7r38ybtw4i2wf3w1nma9ep519tnnv.jpeg', 'https://vektoravto71.ru/catalog/avtomobilnye-masla/masla-motornye-dlya-legkovogo-transporta/masla-importnye_3/shell_1/shell-helix-hx8-synthetic-5w-40-maslo-motornoe-kan-1l/', 'Revendeur', 'Packshot recto Shell Helix HX8 Synthetic 5W-40 1 L de face sur fond blanc.'),
  ('ENRM-HM-140', 'https://shellig.nyc3.cdn.digitaloceanspaces.com/img/product/motorna-olyva-shell-helix-hybrid-0w-20_0_1740737243702', 'https://shell.ig.ua/catalog/motorna-olyva-shell-helix-hybrid-0w-20_5L/', 'Distributeur agréé', 'Packshot recto Shell Helix Hybrid 0W-20 5 L de face, sans cadre logo.'),
  ('ENRM-HM-142', 'https://www.shell.co.uk/fuels-oils-and-coolants/shell-engine-oils/shell-helix-hx7-ect-5w-40/_jcr_content/root/main/section/promo_copy_1482952455.shellimg.png/1691498902032/helix-ultra-5w-40-5l.png', 'https://www.shell.ma/automobilistes/huiles-moteur-et-lubrifiants/huiles-moteur-voiture/huiles-moteur-shell-helix-100-pourcent-synthetique/shell-helix-ultra-5w-40.html', 'Fabricant', 'Packshot recto Shell Helix Ultra 5W-40 5 L de face, image produit Shell sans cadre logo.')
) as v(id, recto, source_recto, origine_image, note)
where p.id = v.id;

notify pgrst, 'reload schema';
