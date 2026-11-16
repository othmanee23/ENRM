import type { Product } from '../../shared/types';
import { brandName } from '../../shared/format';
import { productSlug } from '../../shared/slugs';
import { getPublicHomeProducts } from '../../lib/catalogue';
import { publicPageMetadata, resolveMediaUrl } from '../../lib/seo';
import { ProductCard } from '../../components/storefront/ProductCard';
import { RailScrollButton, VideoControl } from '../../components/storefront/StorefrontControls';

export const metadata = publicPageMetadata(
  'Huiles moteur au Maroc',
  'Découvrez le catalogue ENRM de références d’huiles moteur au Maroc et envoyez votre demande à notre équipe.',
  '/',
);

export const dynamic = 'force-dynamic';

const brands = [
  'Castrol',
  'Motul',
  'Liqui_Moly',
  'Shell',
  'TotalEnergies',
  'Meyle',
  'Petrom',
  'Valvoline',
];
const featuredIds = [
  'ENRM-HM-006',
  'ENRM-HM-067',
  'ENRM-HM-031',
  'ENRM-HM-135',
  'ENRM-HM-155',
  'ENRM-HM-097',
];

function ProductRail({
  id,
  products,
  label,
  compact = false,
}: {
  id: string;
  products: Product[];
  label?: string;
  compact?: boolean;
}) {
  return (
    <div id={id} className={`product-rail${compact ? ' compact-rail' : ''}`} aria-label={label}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function RailControls({ id, label }: { id: string; label: string }) {
  return (
    <div className="collection-controls">
      <p></p>
      <div>
        <RailScrollButton id={id} direction={-1} label={`${label} précédents`} />
        <RailScrollButton id={id} direction={1} label={`${label} suivants`} />
      </div>
    </div>
  );
}

export default async function HomePage() {
  const products = await getPublicHomeProducts();
  const byId = new Map(products.map((product) => [product.id, product]));
  const selected = (ids: string[]) => ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const heroProducts = selected(['ENRM-HM-097', 'ENRM-HM-067', 'ENRM-HM-031']);
  const featured = selected(featuredIds);
  const formats = selected(['ENRM-HM-069', 'ENRM-HM-156', 'ENRM-HM-031', 'ENRM-HM-097']);
  const grade530 = products
    .filter((product) => product.viscosite === '5W-30' && product.litrage === '5 L')
    .slice(0, 6);
  const litre = products.filter((product) => product.litrage === '1 L').slice(0, 6);
  const grade540 = products
    .filter((product) => product.viscosite === '5W-40' && product.litrage === '5 L')
    .slice(0, 6);

  return (
    <>
      <main id="main">
        <section className="cinema-hero single-hero" id="hero" aria-label="L’univers ENRM">
          <div className="hero-film">
            <video
              id="hero-video"
              data-ambient-video
              muted
              loop
              playsInline
              preload="metadata"
              poster="/assets/media/hero-oil-poster.jpg"
              aria-label="De l’huile dorée est versée dans un moteur"
            >
              <source src="/assets/media/hero-oil.mp4" type="video/mp4" />
            </video>
            <div className="cinema-shade"></div>
            <div className="hero-slide-copy">
              <h1>
                Le mouvement.
                <br />À l’état pur.
              </h1>
              <a className="button light" href="/catalogue">
                Explorer les huiles <span>↗</span>
              </a>
            </div>
            <div className="hero-bottom">
              <VideoControl videoId="hero-video" />
            </div>
            <span className="video-fallback" id="video-fallback" hidden>
              Le soin du moteur, en image.
            </span>
          </div>
          <svg className="brand-filter" width="0" height="0" aria-hidden="true" focusable="false">
            <defs>
              <filter id="hero-brand-ink" colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.6378 -2.1456 -0.2166 3 0"
                />
              </filter>
            </defs>
          </svg>
          <section
            id="marques"
            className="brand-section hero-brands"
            aria-label="Les marques du catalogue"
          >
            <div className="marquee" id="marquee">
              <div className="logo-track" id="logo-track">
                {[false, true].map((duplicate) => (
                  <div
                    className="logo-group"
                    aria-hidden={duplicate || undefined}
                    key={String(duplicate)}
                  >
                    {brands.map((brand) => {
                      const extension = brand === 'TotalEnergies' ? 'png' : 'svg';
                      return (
                        <a
                          className="brand-tile"
                          href={`/catalogue?brand=${encodeURIComponent(brand)}`}
                          key={brand}
                          tabIndex={duplicate ? -1 : undefined}
                        >
                          <img
                            src={`/assets/brands/${brand}.${extension}?v=5`}
                            alt={duplicate ? '' : brandName(brand)}
                            loading="eager"
                          />
                        </a>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
        <section
          className="oil-showcase motion-scene cinematic-showcase"
          id="selection-story"
          aria-label="La sélection ENRM"
        >
          <div className="showcase-stage">
            <div className="showcase-copy">
              <h2>
                <span>La précision.</span>
                <span>Dans le détail.</span>
              </h2>
              <a className="button primary" href="/catalogue">
                Découvrir la sélection <span>↗</span>
              </a>
            </div>
            <div id="hero-oils" className="hero-oils" aria-label="Huiles moteur en format 5 litres">
              {heroProducts.map((product) => (
                <a
                  className="hero-oil-item"
                  href={`/produits/${productSlug(product)}`}
                  aria-label={`${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`}
                  key={product.id}
                >
                  {resolveMediaUrl(product.recto) && (
                    <img
                      src={resolveMediaUrl(product.recto)!}
                      alt=""
                      width={370}
                      height={370}
                      fetchPriority="high"
                    />
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
        <section className="collection section" id="selection">
          <div className="section-heading">
            <div>
              <h2>
                De belles références.
                <br />
                Un choix précis.
              </h2>
            </div>
            <a className="text-link" href="/catalogue">
              Explorer les 210 variantes <span>↗</span>
            </a>
          </div>
          <RailControls id="featured-products" label="Produits" />
          <ProductRail id="featured-products" products={featured} label="Sélection de produits" />
          <div className="rail-foot">
            <span>Prix de démonstration par conditionnement.</span>
            <a href="/catalogue">Tout le catalogue ↗</a>
          </div>
        </section>
        <section className="editorial-drive cinematic-detail" id="detail">
          <div className="detail-cinema">
            <img
              src="/assets/media/engine-closeup.jpg"
              alt="Gros plan sur l’huile dorée versée dans un moteur"
              loading="lazy"
              width={1800}
              height={1130}
            />
            <div>
              <h2>
                Le goût
                <br />
                du détail.
              </h2>
              <a className="button light" href="/conseil">
                Trouver ma référence <span>↗</span>
              </a>
            </div>
            <span className="detail-light-pass" aria-hidden="true"></span>
          </div>
        </section>
        <section className="collection section extra-collection" id="grade-530-section">
          <div className="section-heading">
            <h2>
              Le grade 5W-30.
              <br />
              Des références à explorer.
            </h2>
            <a className="text-link" href="/catalogue?viscosity=5W-30&volume=5+L">
              Voir les huiles 5W-30 <span>↗</span>
            </a>
          </div>
          <RailControls id="grade-530" label="Huiles 5W-30" />
          <ProductRail id="grade-530" products={grade530} label="Voir les huiles 5W-30" />
        </section>
        <section className="collection section atelier">
          <div className="section-heading">
            <div>
              <h2>
                À votre rythme.
                <br />À votre format.
              </h2>
            </div>
            <p>
              Pour les conducteurs et les professionnels.
              <br />
              Chaque contenance garde sa référence.
            </p>
          </div>
          <div className="atelier-layout">
            <div className="format-story video-story" id="atelier-film">
              <video
                id="workshop-video"
                data-ambient-video
                muted
                loop
                playsInline
                preload="metadata"
                poster="/assets/media/golden-oil-poster.jpg"
                aria-label="De l’huile dorée est versée dans un moteur"
              >
                <source src="/assets/media/golden-oil.mp4" type="video/mp4" />
              </video>
              <VideoControl videoId="workshop-video" />
              <div>
                <span>LES FORMATS DU QUOTIDIEN</span>
                <h3>
                  Le prochain départ
                  <br />
                  se prépare ici.
                </h3>
                <a className="story-link" href="/catalogue?volume=5+L">
                  Explorer les bidons 5 L ↗
                </a>
              </div>
            </div>
            <div className="atelier-products">
              <RailControls id="atelier-rail" label="Formats" />
              <ProductRail id="atelier-rail" products={formats} compact />
              <a className="text-link" href="/catalogue?volume=20+L">
                Voir les grands formats ↗
              </a>
            </div>
          </div>
        </section>
        <section className="collection section extra-collection" id="litre-products-section">
          <div className="section-heading">
            <h2>
              Le format 1 litre.
              <br />
              Tout aussi précis.
            </h2>
            <a className="text-link" href="/catalogue?volume=1+L">
              Explorer les formats 1 L <span>↗</span>
            </a>
          </div>
          <RailControls id="litre-products" label="Formats 1 L" />
          <ProductRail id="litre-products" products={litre} label="Explorer les formats 1 L" />
        </section>
        <section className="collection section extra-collection" id="grade-540-section">
          <div className="section-heading">
            <h2>
              Le choix du 5W-40.
              <br />
              Dans chaque détail.
            </h2>
            <a className="text-link" href="/catalogue?viscosity=5W-40&volume=5+L">
              Voir les huiles 5W-40 <span>↗</span>
            </a>
          </div>
          <RailControls id="grade-540" label="Huiles 5W-40" />
          <ProductRail id="grade-540" products={grade540} label="Voir les huiles 5W-40" />
        </section>
        <section className="choice-section section">
          <div>
            <h2>
              Trois repères.
              <br />
              Une référence à vous.
            </h2>
          </div>
          <div className="choice-list">
            <a href="/catalogue">
              <span>01</span>
              <div>
                <h3>La formulation avant tout.</h3>
                <p>
                  Comparez la sous-référence et vérifiez les normes prévues par le constructeur.
                </p>
              </div>
              <span>↗</span>
            </a>
            <a href="/catalogue">
              <span>02</span>
              <div>
                <h3>Le grade, avec précision.</h3>
                <p>5W-30, 5W-40… La viscosité est un repère, pas une preuve de compatibilité.</p>
              </div>
              <span>↗</span>
            </a>
            <a href="/conseil">
              <span>03</span>
              <div>
                <h3>Un doute ? Parlons moteur.</h3>
                <p>Préparez votre véhicule, sa motorisation et votre question.</p>
              </div>
              <span>↗</span>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
