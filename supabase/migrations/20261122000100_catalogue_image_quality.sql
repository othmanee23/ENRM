-- Keep the storefront restricted to products with a verified front packshot.
-- Product rows remain in the admin catalogue as unpublished drafts.
update public.products as p
set recto = v.recto,
    url_recto = v.recto,
    statut_recto = 'Packshot vérifié',
    origine_image = v.origine_image,
    source_recto = v.source_recto,
    note = v.note,
    updated_at = now()
from (values
  ('ENRM-HM-001', 'assets/Images/AuditReplacements/ENRM-HM-001.jpg', 'https://www.halfords.com/motoring/engine-oils-and-fluids/engine-oil/castrol-edge-0w-20-c5-1l-425931.html', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.halfords.com/motoring/engine-oils-and-fluids/engine-oil/castrol-edge-0w-20-c5-1l-425931.html'),
  ('ENRM-HM-002', 'assets/Images/AuditReplacements/ENRM-HM-002.png', 'https://www.misteroil.eu/en-eu/shop/product/3680/castrol-edge-c5', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.misteroil.eu/en-eu/shop/product/3680/castrol-edge-c5'),
  ('ENRM-HM-003', 'assets/Images/AuditReplacements/ENRM-HM-003.jpg', 'https://www.castrol.com/content/dam/castrol/master-site/en/global-ia/home/europe/images/products/edge-0w30.png', 'Fabricant', 'Packshot recto vérifié et hébergé localement. Source image: https://www.castrol.com/content/dam/castrol/master-site/en/global-ia/home/europe/images/products/edge-0w30.png'),
  ('ENRM-HM-004', 'assets/Images/AuditReplacements/ENRM-HM-004.jpg', 'https://www.autodoc.de/thumb?id=21499788&lng=en&m=0&n=0&rev=94078001', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.autodoc.de/thumb?id=21499788&lng=en&m=0&n=0&rev=94078001'),
  ('ENRM-HM-007', 'assets/Images/AuditReplacements/ENRM-HM-007.png', 'https://www.misteroil.eu/en-eu/shop/product/1055/castrol-edge-a5-b5', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.misteroil.eu/en-eu/shop/product/1055/castrol-edge-a5-b5'),
  ('ENRM-HM-008', 'assets/Images/AuditReplacements/ENRM-HM-008.jpg', 'https://www.turkoilmarket.com/urun/castrol-edge-0w-20-ll-iv-5-litre', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.turkoilmarket.com/urun/castrol-edge-0w-20-ll-iv-5-litre'),
  ('ENRM-HM-009', 'assets/Images/AuditReplacements/ENRM-HM-009.jpg', 'https://olejeobchod.cz/castrol-edge-5w-30-ll-1l', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://olejeobchod.cz/castrol-edge-5w-30-ll-1l'),
  ('ENRM-HM-010', 'assets/Images/AuditReplacements/ENRM-HM-010.jpg', 'https://www.castrol.com/en_au/australia/home/products/our-brands/automotive/castrol-edge-oils.html', 'Fabricant', 'Packshot recto vérifié et hébergé localement. Source image: https://www.castrol.com/en_au/australia/home/products/our-brands/automotive/castrol-edge-oils.html'),
  ('ENRM-HM-012', 'assets/Images/AuditReplacements/ENRM-HM-012.png', 'https://www.mesterino.ro/poze_produse/127807_1.png', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.mesterino.ro/poze_produse/127807_1.png'),
  ('ENRM-HM-026', 'assets/Images/AuditReplacements/ENRM-HM-026.jpg', 'https://www.zbozi.cz/vyrobek/castrol-magnatec-c3-5w-40/?varianta=5-l', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.zbozi.cz/vyrobek/castrol-magnatec-c3-5w-40/?varianta=5-l'),
  ('ENRM-HM-130', 'assets/Images/AuditReplacements/ENRM-HM-130.png', 'https://www.misteroil.nl/nl-nl/shop/product/926/shell-helix-hx5', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.misteroil.nl/nl-nl/shop/product/926/shell-helix-hx5'),
  ('ENRM-HM-132', 'assets/Images/AuditReplacements/ENRM-HM-132.jpg', 'https://www.automax-group.com/sk/shell-helix-hx6-10w-40-12-1l-pv2258', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.automax-group.com/sk/shell-helix-hx6-10w-40-12-1l-pv2258'),
  ('ENRM-HM-137', 'assets/Images/AuditReplacements/ENRM-HM-137.jpg', 'https://vektoravto71.ru/catalog/avtomobilnye-masla/masla-motornye-dlya-legkovogo-transporta/masla-importnye_3/shell_1/shell-helix-hx8-synthetic-5w-40-maslo-motornoe-kan-1l/', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://vektoravto71.ru/catalog/avtomobilnye-masla/masla-motornye-dlya-legkovogo-transporta/masla-importnye_3/shell_1/shell-helix-hx8-synthetic-5w-40-maslo-motornoe-kan-1l/'),
  ('ENRM-HM-138', 'assets/Images/AuditReplacements/ENRM-HM-138.png', 'https://atlasoil.africa/products/shell-helix-hx8-5w40-sn-5l-bottle', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://atlasoil.africa/products/shell-helix-hx8-5w40-sn-5l-bottle'),
  ('ENRM-HM-139', 'assets/Images/AuditReplacements/ENRM-HM-139.jpg', 'https://www.autodoc24.ro/shell/13627654', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://www.autodoc24.ro/shell/13627654'),
  ('ENRM-HM-140', 'assets/Images/AuditReplacements/ENRM-HM-140.jpg', 'https://www.shell.ma/automobilistes/huiles-moteur-et-lubrifiants/huiles-moteur-voiture/huiles-moteur-shell-helix-100-pourcent-synthetique/shell-helix-hybrid-0w20-sp.html', 'Fabricant', 'Packshot recto vérifié et hébergé localement. Source image: https://www.shell.ma/automobilistes/huiles-moteur-et-lubrifiants/huiles-moteur-voiture/huiles-moteur-shell-helix-100-pourcent-synthetique/shell-helix-hybrid-0w20-sp.html'),
  ('ENRM-HM-141', 'assets/Images/AuditReplacements/ENRM-HM-141.jpg', 'https://cdn.autodoc.de/thumb?id=23048735&lng=en&m=0&n=0&rev=94077992', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://cdn.autodoc.de/thumb?id=23048735&lng=en&m=0&n=0&rev=94077992'),
  ('ENRM-HM-145', 'assets/Images/AuditReplacements/ENRM-HM-145.png', 'https://static.silux.si/media/cache/mo/motorno-ulje-shell-helix-ultra-professional-af-5w30-1l-501568299c1376ec39f7a7862b31a1dc.png', 'Revendeur', 'Packshot recto vérifié et hébergé localement. Source image: https://static.silux.si/media/cache/mo/motorno-ulje-shell-helix-ultra-professional-af-5w30-1l-501568299c1376ec39f7a7862b31a1dc.png')
) as v(id, recto, source_recto, origine_image, note)
where p.id = v.id;

update public.products
set is_published = false,
    show_on_website = false,
    updated_at = now()
where id in ('ENRM-HM-014', 'ENRM-HM-023', 'ENRM-HM-025', 'ENRM-HM-069', 'ENRM-HM-070', 'ENRM-HM-073', 'ENRM-HM-080', 'ENRM-HM-086', 'ENRM-HM-087', 'ENRM-HM-095', 'ENRM-HM-096', 'ENRM-HM-098', 'ENRM-HM-100', 'ENRM-HM-101', 'ENRM-HM-102', 'ENRM-HM-104', 'ENRM-HM-105', 'ENRM-HM-106', 'ENRM-HM-107', 'ENRM-HM-109', 'ENRM-HM-110', 'ENRM-HM-111', 'ENRM-HM-112', 'ENRM-HM-114', 'ENRM-HM-115', 'ENRM-HM-116', 'ENRM-HM-117', 'ENRM-HM-119', 'ENRM-HM-120', 'ENRM-HM-121', 'ENRM-HM-123', 'ENRM-HM-125', 'ENRM-HM-127', 'ENRM-HM-133', 'ENRM-HM-136', 'ENRM-HM-143', 'ENRM-HM-144', 'ENRM-HM-148', 'ENRM-HM-149', 'ENRM-HM-151', 'ENRM-HM-174', 'ENRM-HM-175')
   or btrim(coalesce(recto, '')) = ''
   or lower(coalesce(statut_recto, '')) like '%générique%';

notify pgrst, 'reload schema';
