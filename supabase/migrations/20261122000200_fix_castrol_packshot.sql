-- Replace the broken external image URL for this exact 1 L product.
update public.products
set recto = 'https://www.reifen.com/images/thumbs/075/0756678_Castrol-Castrol-Edge-Professional-Longlife-III-3-0W-30-1-15391931-full.jpg_550.webp',
    url_recto = 'https://www.reifen.com/images/thumbs/075/0756678_Castrol-Castrol-Edge-Professional-Longlife-III-3-0W-30-1-15391931-full.jpg_550.webp',
    statut_recto = 'Packshot vérifié',
    origine_image = 'Revendeur',
    source_recto = 'https://www.reifen.com/en-de/castrol-castrol-edge-professional-longlife-iii3-0w-30-1-4008177183898',
    note = 'Packshot recto exact 1 L, fond blanc, sans filigrane. Source produit: https://www.reifen.com/en-de/castrol-castrol-edge-professional-longlife-iii3-0w-30-1-4008177183898',
    updated_at = now()
where id = 'ENRM-HM-011';

notify pgrst, 'reload schema';
