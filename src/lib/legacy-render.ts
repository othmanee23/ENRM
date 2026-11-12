import { legacyPages } from '../generated/legacy-pages';
import { brandName, esc } from '../shared/format';
import type { Product } from '../shared/types';
import { productSlug } from '../shared/slugs';

const money = (value: number) =>
  new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(value);

function card(product: Product): string {
  const label = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const image = product.recto
    ? `<img src="/${esc(product.recto.replace(/^\//, ''))}" alt="${esc(label)}" loading="lazy" width="370" height="370">`
    : `<div class="placeholder"><b>${esc(product.litrage)}</b><span>Visuel exact à venir</span></div>`;
  const url = `/produits/${esc(productSlug(product))}`;
  return `<article class="product-card"><a class="product-image" href="${url}"><span class="image-tag">${product.statut_recto.includes('générique') ? 'Illustration générique' : esc(product.litrage)}</span>${image}<span class="image-arrow" aria-hidden="true">↗</span></a><div class="card-copy"><p class="product-brand">${esc(brandName(product.marque))}</p><h3><a href="${url}">${esc(product.sous_reference)}</a></h3><p class="product-meta">${esc(product.viscosite)} <span>·</span> ${esc(product.litrage)}</p><div class="product-price"><span>${money(product.price)}</span><button class="quick-add" data-add="${esc(product.id)}" aria-label="Ajouter ${esc(label)} au panier">＋</button></div></div></article>`;
}

function heroCard(product: Product): string {
  const label = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const image = product.recto
    ? `<img src="/${esc(product.recto.replace(/^\//, ''))}" alt="${esc(label)}" width="370" height="370" fetchpriority="high">`
    : '';
  return `<a class="hero-oil-item" href="/produits/${esc(productSlug(product))}" aria-label="${esc(label)}">${image}</a>`;
}

export function renderLegacyHome(products: Product[]): string {
  let html: string = legacyPages.home.html;
  const byId = new Map(products.map((product) => [product.id, product]));
  const sections: Record<string, string[]> = {
    'hero-oils': ['ENRM-HM-097', 'ENRM-HM-067', 'ENRM-HM-031'],
    'featured-products': [
      'ENRM-HM-006',
      'ENRM-HM-067',
      'ENRM-HM-031',
      'ENRM-HM-135',
      'ENRM-HM-155',
      'ENRM-HM-097',
    ],
    'atelier-rail': ['ENRM-HM-069', 'ENRM-HM-156', 'ENRM-HM-031', 'ENRM-HM-097'],
  };
  for (const [id, ids] of Object.entries(sections)) {
    const cards = ids
      .flatMap((productId) => {
        const item = byId.get(productId);
        return item ? [id === 'hero-oils' ? heroCard(item) : card(item)] : [];
      })
      .join('');
    const pattern = new RegExp(
      `(<(?:div|section)[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(<\\/(?:div|section)>)`,
      'i',
    );
    html = html.replace(
      pattern,
      (_match, opening: string, closing: string) => `${opening}${cards}${closing}`,
    );
  }
  return html;
}

export function renderCatalogueGrid(products: Product[]): string {
  if (!products.length) {
    return '<div class="empty"><h2>Aucune référence trouvée.</h2><p>Essayez d’élargir votre recherche ou vos filtres.</p><a class="text-link" href="/catalogue">Explorer toutes les références ↗</a></div>';
  }
  return products.slice(0, 12).map(card).join('');
}

export function renderLegacyProduct(product: Product, products: Product[]): string {
  const title = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const image = product.recto
    ? `<img src="/${esc(product.recto.replace(/^\//, ''))}" alt="${esc(title)}" width="640" height="640" fetchpriority="high">`
    : `<div class="placeholder"><b>${esc(product.litrage)}</b><span>Visuel exact à venir</span></div>`;
  const variants = products.filter(
    (candidate) =>
      candidate.marque === product.marque &&
      candidate.gamme === product.gamme &&
      candidate.viscosite === product.viscosite,
  );
  const variantLinks = variants
    .map((variant) => {
      const selected = variant.id === product.id;
      return `<a href="/produits/${esc(productSlug(variant))}" data-variant="${esc(variant.id)}" class="${selected ? 'selected' : ''}" ${selected ? 'aria-current="true"' : ''}>${esc(variant.litrage)}</a>`;
    })
    .join('');
  const related = products
    .filter((candidate) => candidate.id !== product.id && candidate.marque === product.marque)
    .slice(0, 5)
    .map(card)
    .join('');
  const gallery = product.verso
    ? '<div class="gallery-buttons"><button data-face="recto" aria-pressed="true">Recto</button><button data-face="verso" aria-pressed="false">Verso</button></div>'
    : '';
  const root = `<div id="product-page" aria-live="polite"><div class="product-breadcrumb"><a href="/catalogue" id="back-catalogue">← Revenir au catalogue</a><span>${esc(brandName(product.marque))} / ${esc(product.sous_reference)}</span></div><section class="product-layout"><div class="detail-visual"><div id="detail-photo">${image}</div><p class="media-caption">${product.recto ? (product.statut_recto.includes('générique') ? 'Illustration générique du contenant.' : `Visuel du conditionnement ${esc(product.litrage)}.`) : 'La photo exacte de cette variante reste à compléter.'}</p>${gallery}</div><div class="detail-copy"><p class="eyebrow">${esc(brandName(product.marque))}</p><h1>${esc(product.sous_reference)}<span>${esc(product.viscosite)}</span></h1><p class="detail-reference">${esc(product.id)} · Disponibilité à confirmer</p><div class="detail-price">${money(product.price)} MAD</div><p class="muted">Prix indicatif pour ${esc(product.litrage)} · à confirmer par ENRM</p><fieldset class="variant-fieldset"><legend>Votre contenance</legend><div class="volume-options">${variantLinks}</div></fieldset><div class="buy-line"><label>Quantité<input class="quantity" id="detail-qty" type="number" value="1" min="1" max="99"></label><button class="button primary" id="detail-add">Ajouter au panier <span>＋</span></button></div><p class="muted">Votre demande sera confirmée par ENRM. Aucun paiement en ligne.</p><a href="/conseil" class="detail-advice">Un doute sur votre moteur ? <span>Parlons-en ↗</span></a><div class="product-service"><span>Conditionnement exact</span><span>Référence identifiable</span></div></div></section><section class="product-specs section"><div><p class="eyebrow">CHAQUE DÉTAIL COMPTE</p><h2>La référence,<br>en toute clarté.</h2></div><div><dl><div><dt>Marque</dt><dd>${esc(brandName(product.marque))}</dd></div><div><dt>Gamme</dt><dd>${esc(product.gamme)}</dd></div><div><dt>Sous-référence</dt><dd>${esc(product.sous_reference)}</dd></div><div><dt>Grade SAE</dt><dd>${esc(product.viscosite)}</dd></div><div><dt>Contenance</dt><dd>${esc(product.litrage)}</dd></div><div><dt>Référence fabricant</dt><dd>${esc(product.references_articles || 'À confirmer')}</dd></div></dl><p>${esc(product.designation)}</p><p class="muted">La viscosité seule ne prouve pas la compatibilité. Vérifiez les normes et homologations avec la documentation du constructeur et du fabricant.</p><p class="muted">Prix, stock, frais de livraison et version d’emballage à confirmer par ENRM.</p></div></section><section class="section related-section"><div class="section-heading"><h2>Poursuivre la découverte.</h2><a href="/catalogue" class="text-link">Toutes les huiles ↗</a></div><p class="muted">Autres références de la marque. Ces produits ne sont pas des substituts techniques.</p><div class="product-rail">${related}</div></section></div>`;
  return legacyPages.product.html.replace(/<div id="product-page"[\s\S]*?<\/div>/, () => root);
}
