import type { Product } from '../shared/types';
import { esc } from '../shared/format';
import { icon } from './icons';
export function thumb(p?: Partial<Product>) {
  return p?.recto
    ? `<span class="thumb"><img src="${esc(p.recto)}" alt=""></span>`
    : `<span class="thumb empty">${esc(p?.litrage || '5 L')}</span>`;
}
export function badge(s: string) {
  return `<span class="badge ${{ Livrée: 'green', Payée: 'green', Actif: 'green', 'À préparer': 'amber', 'En préparation': 'amber', 'À encaisser': 'amber', Expédiée: 'blue', Annulée: 'red', Brouillon: '', Inactif: '' }[s] || ''}">${esc(s)}</span>`;
}
export function field(
  label: string,
  name: string,
  value: string | number = '',
  type = 'text',
  extra = '',
) {
  return `<label class="field ${extra.includes('full') ? 'full' : ''}">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra.replace('full', '')} required></label>`;
}
export function formActions(label = 'Enregistrer') {
  return `<div class="form-actions full"><button type="button" class="btn" data-action="cancel">Annuler</button><button class="btn primary" type="submit">${label} ${icon('check')}</button></div>`;
}
export function empty(
  text = 'Aucun résultat',
  sub = 'Essayez une autre recherche ou un autre filtre.',
) {
  return `<div class="empty-state">${icon('search')}<h3>${text}</h3><p>${sub}</p></div>`;
}
