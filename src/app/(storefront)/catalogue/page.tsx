import type { Metadata } from 'next';
import { ProductCard } from '../../../components/storefront/ProductCard';
import {
  getPublicCatalogueFacets,
  getPublicCataloguePage,
  getPublicCategories,
} from '../../../lib/catalogue';
import { publicPageMetadata } from '../../../lib/seo';
import { brandName } from '../../../shared/format';
import { FilterToggle } from '../../../components/storefront/StorefrontControls';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, ...keys: string[]): string {
  for (const key of keys) {
    const found = params[key];
    if (typeof found === 'string') return found.trim();
  }
  return '';
}

function filterQuery(params: SearchParams): URLSearchParams {
  const query = new URLSearchParams();
  const aliases: [string, string][] = [
    ['search', 'search'],
    ['q', 'search'],
    ['category', 'category'],
    ['brand', 'brand'],
    ['marque', 'brand'],
    ['range', 'range'],
    ['viscosity', 'viscosity'],
    ['viscosite', 'viscosity'],
    ['volume', 'volume'],
    ['sort', 'sort'],
  ];
  for (const [source, destination] of aliases) {
    const item = value(params, source);
    if (item && !query.has(destination)) query.set(destination, item);
  }
  return query;
}

function Pagination({
  page,
  pageSize,
  total,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  params: SearchParams;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const query = filterQuery(params);
  const href = (nextPage: number) => {
    const next = new URLSearchParams(query);
    if (nextPage > 1) next.set('page', String(nextPage));
    return `/catalogue${next.size ? `?${next.toString()}` : ''}`;
  };
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="load-area">
      <p className="muted">
        {first}–{last} sur {total} références
      </p>
      <nav className="catalogue-pagination" aria-label="Pages du catalogue">
        {page > 1 ? (
          <a className="outline" href={href(page - 1)}>
            ← Précédent
          </a>
        ) : (
          <span className="outline" aria-disabled="true">
            ← Précédent
          </span>
        )}
        <span aria-current="page">
          Page {page} / {pageCount}
        </span>
        {page < pageCount ? (
          <a className="outline" href={href(page + 1)}>
            Suivant →
          </a>
        ) : (
          <span className="outline" aria-disabled="true">
            Suivant →
          </span>
        )}
      </nav>
      <p className="muted">Prix de démonstration. Disponibilité à confirmer par ENRM.</p>
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  selected,
  options,
  emptyLabel,
}: {
  id: string;
  name: string;
  label: string;
  selected: string;
  options: Array<{ value: string; label: string }>;
  emptyLabel: string;
}) {
  return (
    <label>
      {label}
      <select id={id} name={name} defaultValue={selected}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number.parseInt(value(params, 'page') || '1', 10) || 1);
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
    ...publicPageMetadata(
      'Catalogue des huiles moteur',
      'Parcourez les références d’huiles moteur ENRM au Maroc par marque, formulation, viscosité et conditionnement.',
      !hasFilters && requestedPage > 1 ? `/catalogue?page=${requestedPage}` : '/catalogue',
    ),
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
  const pageCount = Math.max(1, Math.ceil(result.total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  if (page !== requestedPage) result = await getPublicCataloguePage({ ...filters, page });
  const selectedBrand = value(params, 'brand', 'marque');

  return (
    <>
      <main id="main">
        <section className="catalogue section" id="catalogue">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LE CATALOGUE ENRM</p>
              <h1>
                Votre moteur.
                <br />
                Votre référence.
              </h1>
            </div>
            <p>
              Marques, formulations, grades et formats.
              <br />
              Explorez {result.total} variantes documentées.
            </p>
          </div>
          <form id="catalogue-filters" action="/catalogue" method="get">
            <div className="catalogue-toolbar">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  id="search"
                  name="search"
                  type="search"
                  placeholder="Marque, gamme, 5W-30…"
                  aria-label="Rechercher une huile"
                  defaultValue={value(params, 'search', 'q')}
                />
              </label>
              <FilterToggle />
            </div>
            <div className="catalogue-layout">
              <aside className="filters" id="filters" aria-label="Filtres du catalogue">
                <div className="filter-heading">
                  <h2>Affiner la sélection</h2>
                  <a className="text-link" id="reset" href="/catalogue">
                    Tout effacer ↺
                  </a>
                </div>
                <SelectField
                  id="category"
                  name="category"
                  label="Catégorie"
                  emptyLabel="Toutes les catégories"
                  selected={categorySlug}
                  options={categories.map((category) => ({
                    value: category.slug,
                    label: category.name,
                  }))}
                />
                <SelectField
                  id="brand"
                  name="brand"
                  label="Marque"
                  emptyLabel="Toutes les marques"
                  selected={selectedBrand}
                  options={facets.brands.map((brand) => ({
                    value: brand,
                    label: brandName(brand),
                  }))}
                />
                <SelectField
                  id="range"
                  name="range"
                  label="Gamme"
                  emptyLabel="Toutes les gammes"
                  selected={value(params, 'range')}
                  options={facets.ranges.map((item) => ({ value: item, label: item }))}
                />
                <SelectField
                  id="viscosity"
                  name="viscosity"
                  label="Viscosité"
                  emptyLabel="Tous les grades"
                  selected={value(params, 'viscosity', 'viscosite')}
                  options={facets.viscosities.map((item) => ({ value: item, label: item }))}
                />
                <SelectField
                  id="volume"
                  name="volume"
                  label="Contenance"
                  emptyLabel="Tous les formats"
                  selected={value(params, 'volume')}
                  options={facets.volumes.map((item) => ({ value: item, label: item }))}
                />
                <button className="button primary" type="submit">
                  Afficher les résultats ↗
                </button>
              </aside>
              <div className="catalogue-results">
                <div className="results-bar">
                  <p id="results-count" role="status">
                    {result.total} variante{result.total !== 1 ? 's' : ''} trouvée
                    {result.total !== 1 ? 's' : ''}
                  </p>
                  <label>
                    Trier par
                    <select
                      id="sort"
                      name="sort"
                      defaultValue={value(params, 'sort') || 'selection'}
                    >
                      <option value="selection">Sélection ENRM</option>
                      <option value="price-up">Prix croissant</option>
                      <option value="price-down">Prix décroissant</option>
                      <option value="name">Nom A–Z</option>
                    </select>
                  </label>
                </div>
                <div id="active-filters" aria-live="polite">
                  {[
                    selectedBrand && brandName(selectedBrand),
                    categorySlug && categories.find((item) => item.slug === categorySlug)?.name,
                    value(params, 'range'),
                    value(params, 'viscosity', 'viscosite'),
                    value(params, 'volume'),
                    value(params, 'search', 'q') && `« ${value(params, 'search', 'q')} »`,
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                </div>
                {result.rows.length ? (
                  <div id="product-grid" className="product-grid">
                    {result.rows.map((product) => (
                      <ProductCard product={product} key={product.id} />
                    ))}
                  </div>
                ) : (
                  <div id="product-grid" className="empty">
                    <h2>
                      {['Meyle', 'Valvoline'].includes(selectedBrand)
                        ? 'Le catalogue arrive prochainement.'
                        : 'Aucune référence trouvée.'}
                    </h2>
                    <p>Les références et visuels sont ajoutés après validation par ENRM.</p>
                    <a className="text-link" href="/catalogue">
                      Explorer les autres références ↗
                    </a>
                  </div>
                )}
                <Pagination page={page} pageSize={pageSize} total={result.total} params={params} />
              </div>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
