import type { Product } from '../shared/types';
import { esc, brandName, currency as money } from '../shared/format';
import { productUrl } from './routing';
export function photo(p: Product, loading = 'lazy') {
  return p.recto
    ? `<img src="${esc(p.recto)}" alt="${esc(brandName(p.marque) + ' ' + p.sous_reference + ' ' + p.viscosite + ' — ' + p.litrage)}" loading="${loading}">`
    : `<div class="placeholder"><b>${esc(p.litrage)}</b><span>Visuel exact à venir</span></div>`;
}
export function card(p: Product) {
  return `<article class="product-card"><a class="product-image" href="${esc(productUrl(p.id))}"><span class="image-tag">${p.statut_recto.includes('générique') ? 'Illustration générique' : esc(p.litrage)}</span>${photo(p)}<span class="image-arrow" aria-hidden="true">↗</span></a><div class="card-copy"><p class="product-brand">${esc(brandName(p.marque))}</p><h3><a href="${esc(productUrl(p.id))}">${esc(p.sous_reference)}</a></h3><p class="product-meta">${esc(p.viscosite)} <span>·</span> ${esc(p.litrage)}</p><div class="product-price"><span>${money(p.price)}</span><button class="quick-add" data-add="${p.id}" aria-label="Ajouter ${esc(brandName(p.marque) + ' ' + p.sous_reference + ' ' + p.viscosite + ' ' + p.litrage)} au panier démo">＋</button></div></div></article>`;
}
