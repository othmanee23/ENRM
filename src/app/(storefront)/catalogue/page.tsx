import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
import {
  getPublicCatalogueFacets,
  getPublicCataloguePage,
  getPublicCategories,
} from '../../../lib/catalogue';
import { legacyPages } from '../../../generated/legacy-pages';
import { renderCatalogueGrid } from '../../../lib/legacy-render';
import { brandName, esc } from '../../../shared/format';
import type { Category } from '../../../shared/types';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
function value(params: SearchParams, ...keys: string[]): string {
  for (const key of keys) {
    const found = params[key];
    if (typeof found === 'string') return found.trim();
  }
  return '';
}
function selectedOption(
  value: string,
  selected: string,
  label: (item: string) => string = (item) => item,
) {
  return `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label(value))}</option>`;
}
function setOptions(html: string, id: string, options: string) {
  const pattern = new RegExp(`(<select\\b[^>]*id="${id}"[^>]*>)[\\s\\S]*?(<\\/select>)`);
  return html.replace(
    pattern,
    (_match, open: string, close: string) => `${open}${options}${close}`,
  );
}
function filterQuery(params: SearchParams) {
  const query = new URLSearchParams();
  for (const key of [
    'search',
    'q',
    'category',
    'brand',
    'marque',
    'range',
    'viscosity',
    'viscosite',
    'volume',
    'sort',
  ]) {
    const item = value(params, key);
    if (item)
      query.set(
        key === 'q'
          ? 'search'
          : key === 'marque'
            ? 'brand'
            : key === 'viscosite'
              ? 'viscosity'
              : key,
        item,
      );
  }
  return query;
}
function paginationMarkup(page: number, pageSize: number, total: number, params: SearchParams) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const query = filterQuery(params);
  const href = (nextPage: number) => {
    const next = new URLSearchParams(query);
    if (nextPage > 1) next.set('page', String(nextPage));
    return `/catalogue${next.size ? `?${next.toString()}` : ''}`;
  };
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);
  const previous =
    page > 1
      ? `<a class="outline" href="${esc(href(page - 1))}">← Précédent</a>`
      : '<span class="outline" aria-disabled="true">← Précédent</span>';
  const next =
    page < pages
      ? `<a class="outline" href="${esc(href(page + 1))}">Suivant →</a>`
      : '<span class="outline" aria-disabled="true">Suivant →</span>';
  return `<div class="load-area"><p class="muted">${from}–${to} sur ${total} références</p><nav class="catalogue-pagination" aria-label="Pages du catalogue">${previous}<span aria-current="page">Page ${page} / ${pages}</span>${next}</nav><p class="muted">Prix de démonstration. Disponibilité à confirmer par ENRM.</p></div>`;
}
function optionControls(
  html: string,
  categories: Category[],
  facets: Awaited<ReturnType<typeof getPublicCatalogueFacets>>,
  params: SearchParams,
) {
  html = setOptions(
    html,
    'category',
    '<option value="">Toutes les catégories</option>' +
      categories
        .map((category) =>
          selectedOption(
            category.slug,
            value(params, 'category'),
            (slug) => categories.find((item) => item.slug === slug)?.name || slug,
          ),
        )
        .join(''),
  );
  html = setOptions(
    html,
    'brand',
    '<option value="">Toutes les marques</option>' +
      facets.brands
        .map((brand) => selectedOption(brand, value(params, 'brand', 'marque'), brandName))
        .join(''),
  );
  html = setOptions(
    html,
    'range',
    '<option value="">Toutes les gammes</option>' +
      facets.ranges.map((item) => selectedOption(item, value(params, 'range'))).join(''),
  );
  html = setOptions(
    html,
    'viscosity',
    '<option value="">Tous les grades</option>' +
      facets.viscosities
        .map((item) => selectedOption(item, value(params, 'viscosity', 'viscosite')))
        .join(''),
  );
  html = setOptions(
    html,
    'volume',
    '<option value="">Tous les formats</option>' +
      facets.volumes.map((item) => selectedOption(item, value(params, 'volume'))).join(''),
  );
  html = setOptions(
    html,
    'sort',
    [
      ['selection', 'Sélection ENRM'],
      ['price-up', 'Prix croissant'],
      ['price-down', 'Prix décroissant'],
      ['name', 'Nom A–Z'],
    ]
      .map(([sort, label]) =>
        selectedOption(sort, value(params, 'sort') || 'selection', () => label),
      )
      .join(''),
  );
  html = html.replace('id="search"', `id="search" value="${esc(value(params, 'search', 'q'))}"`);
  return html;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(value(params, 'page') || '1', 10) || 1);
  const hasFilters = [
    'search',
    'q',
    'category',
    'brand',
    'marque',
    'range',
    'viscosity',
    'viscosite',
    'volume',
    'sort',
  ].some(
    (key) => Boolean(value(params, key)) && !(key === 'sort' && value(params, key) === 'selection'),
  );
  return {
    title: 'Catalogue des huiles moteur',
    description:
      'Parcourez les références d’huiles moteur ENRM au Maroc par marque, formulation, viscosité et conditionnement.',
    alternates: { canonical: !hasFilters && page > 1 ? `/catalogue?page=${page}` : '/catalogue' },
    ...(hasFilters ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [categories, facets] = await Promise.all([
    getPublicCategories(),
    getPublicCatalogueFacets(),
  ]);
  const categorySlug = value(params, 'category');
  const categoryId = categories.find((category) => category.slug === categorySlug)?.id;
  const requestedPage = Math.max(1, Number.parseInt(value(params, 'page') || '1', 10) || 1);
  const pageSize = 12;
  const filters = {
    page: requestedPage,
    pageSize,
    query: value(params, 'search', 'q'),
    categoryId,
    brand: value(params, 'brand', 'marque'),
    range: value(params, 'range'),
    viscosity: value(params, 'viscosity', 'viscosite'),
    volume: value(params, 'volume'),
    sort: value(params, 'sort') || 'selection',
  };
  let result = await getPublicCataloguePage(filters);
  const pages = Math.max(1, Math.ceil(result.total / pageSize));
  const page = Math.min(requestedPage, pages);
  if (page !== requestedPage) result = await getPublicCataloguePage({ ...filters, page });

  let html: string = legacyPages.catalogue.html;
  html = optionControls(html, categories, facets, params);
  html = html.replace(
    'Explorez les 210 variantes documentées.',
    `Explorez ${result.total} variantes documentées.`,
  );
  html = html.replace(
    /(<div[^>]*id="product-grid"[^>]*>)[\s\S]*?(<\/div>)/,
    `$1${renderCatalogueGrid(result.rows)}$2`,
  );
  html = html.replace(
    /<div class="load-area">[\s\S]*?<\/div>/,
    paginationMarkup(page, pageSize, result.total, params),
  );
  const bootstrap = JSON.stringify({ products: result.rows, categories, facets }).replace(
    /</g,
    '\\u003c',
  );
  html += `<script id="catalogue-bootstrap" type="application/json">${bootstrap}</script>`;
  return <LegacyPage name="catalogue" html={html} />;
}
