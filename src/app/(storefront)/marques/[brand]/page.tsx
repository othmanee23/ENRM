import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCard } from '../../../../components/storefront/ProductCard';
import { getPublicCatalogue, productSlug } from '../../../../lib/catalogue';
import { getSiteUrl, publicPageMetadata } from '../../../../lib/seo';
import { brandName } from '../../../../shared/format';

export const dynamic = 'force-dynamic';

const brands = {
  shell: {
    name: 'Shell',
    title: 'Huiles moteur Shell au Maroc — ENRM',
    description:
      'Parcourez les huiles moteur Shell disponibles au catalogue ENRM au Maroc. Comparez les références, viscosités et contenances; prix à confirmer.',
    intro:
      'La gamme Shell Helix regroupe des huiles moteur aux formulations et usages différents. La référence adaptée dépend des préconisations du constructeur, de la viscosité et des homologations requises pour votre moteur.',
    source: 'Gamme officielle Shell Helix',
    sourceUrl: 'https://www.shell.com/motorist/oils-lubricants/helix-for-cars.html',
  },
  totalenergies: {
    name: 'TotalEnergies',
    title: 'Huiles moteur TotalEnergies au Maroc — ENRM',
    description:
      'Consultez les huiles moteur TotalEnergies Quartz du catalogue ENRM au Maroc. Comparez les références, viscosités et contenances; prix à confirmer.',
    intro:
      'La gamme TotalEnergies Quartz comprend plusieurs familles, dont Quartz Ineo, Quartz 9000 et Quartz 7000. Les spécifications varient selon les références : vérifiez toujours la viscosité et les homologations demandées dans le manuel du véhicule.',
    source: 'Gamme officielle TotalEnergies Quartz',
    sourceUrl: 'https://lubricants.totalenergies.com/quartz-range',
  },
  castrol: {
    name: 'Castrol',
    title: 'Huiles moteur Castrol au Maroc — ENRM',
    description:
      'Parcourez les huiles moteur Castrol disponibles au catalogue ENRM au Maroc. Comparez les références, viscosités et contenances; prix à confirmer.',
    intro:
      'Castrol propose plusieurs familles d’huiles moteur, notamment EDGE, MAGNATEC et GTX. Chaque référence répond à des spécifications particulières : vérifiez les exigences du constructeur avant de choisir.',
    source: 'gamme officielle Castrol',
    sourceUrl:
      'https://www.castrol.com/en_gb/united-kingdom/home/products/our-brands/automotive.html',
  },
  motul: {
    name: 'Motul',
    title: 'Huiles moteur Motul au Maroc — ENRM',
    description:
      'Consultez les huiles moteur Motul du catalogue ENRM au Maroc. Comparez les références, viscosités et contenances; prix à confirmer.',
    intro:
      'Motul propose des huiles moteur pour différentes applications automobiles. Les recommandations, viscosités et homologations dépendent de chaque référence et du véhicule : consultez son manuel pour choisir.',
    source: 'sélecteur officiel Motul',
    sourceUrl: 'https://www.motul.com/en-GB/lubricants',
  },
  'liqui-moly': {
    name: 'Liqui_Moly',
    title: 'Huiles moteur LIQUI MOLY au Maroc — ENRM',
    description:
      'Parcourez les huiles moteur LIQUI MOLY disponibles au catalogue ENRM au Maroc. Comparez les références, viscosités et contenances; prix à confirmer.',
    intro:
      'LIQUI MOLY présente des huiles moteur avec différentes viscosités, applications et homologations. Vérifiez les spécifications de la référence et les recommandations du constructeur pour votre véhicule.',
    source: 'huiles moteur officielles LIQUI MOLY',
    sourceUrl: 'https://www.liqui-moly.com/en/engine-oils.html',
  },
  petrom: {
    name: 'Petrom',
    title: 'Huiles moteur Petrom au Maroc — ENRM',
    description:
      'Découvrez les lubrifiants moteur Petrom disponibles au catalogue ENRM au Maroc. Comparez les références, viscosités et contenances; prix à confirmer.',
    intro:
      'Au Maroc, Petrom présente sa marque de lubrifiants XPRO pour les professionnels et les particuliers. Consultez les informations de chaque référence et vérifiez les préconisations du constructeur avant votre choix.',
    source: 'gamme officielle des lubrifiants Petrom',
    sourceUrl: 'https://petrom.ma/produits-et-services/lubrifiants/',
  },
} as const;

type BrandSlug = keyof typeof brands;
type Props = { params: Promise<{ brand: string }> };

function getBrand(slug: string) {
  return Object.hasOwn(brands, slug) ? brands[slug as BrandSlug] : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand: slug } = await params;
  const brand = getBrand(slug);
  if (!brand) return { title: 'Marque introuvable', robots: { index: false, follow: false } };
  return publicPageMetadata(brand.title, brand.description, `/marques/${slug}`);
}

export default async function BrandPage({ params }: Props) {
  const { brand: slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const products = (await getPublicCatalogue()).filter(
    (product) => product.marque.toLowerCase() === brand.name.toLowerCase(),
  );
  if (!products.length) notFound();

  const siteUrl = getSiteUrl();
  const pageUrl = new URL(`/marques/${slug}`, siteUrl).href;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: brand.title,
    description: brand.description,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: new URL(`/produits/${productSlug(product)}`, siteUrl).href,
        name: `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`,
      })),
    },
  };

  return (
    <main id="main" className="section brand-page collection">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <nav className="product-breadcrumb" aria-label="Fil d’Ariane">
        <a href="/">Accueil</a>
        <span aria-hidden="true">/</span>
        <a href="/catalogue">Produits</a>
        <span aria-hidden="true">/</span>
        <span>{brandName(brand.name)}</span>
      </nav>

      <div className="brand-page-intro">
        <div className="brand-page-title">
          <p className="eyebrow">Catalogue ENRM · Maroc</p>
          <h1>Huiles moteur {brandName(brand.name)}</h1>
        </div>
        <div className="brand-page-copy">
          <p>{brand.intro}</p>
          <p>
            Choisissez votre huile selon les prescriptions du constructeur. La viscosité seule ne
            suffit pas : contrôlez aussi les normes et homologations demandées. Les prix et la
            disponibilité sont confirmés par ENRM.
          </p>
          <a href={brand.sourceUrl} target="_blank" rel="noreferrer">
            Consulter la {brand.source} ↗
          </a>
        </div>
      </div>

      <section aria-labelledby="brand-products-title">
        <div className="brand-products-heading">
          <h2 id="brand-products-title">Références {brandName(brand.name)} au catalogue</h2>
          <p>
            {products.length} référence{products.length > 1 ? 's' : ''} actuellement affichée
            {products.length > 1 ? 's' : ''}.
          </p>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
