import type { Product } from '../../shared/types';
import { brandName } from '../../shared/format';
import { getPublicHomeProducts } from '../../lib/catalogue';
import { publicPageMetadata } from '../../lib/seo';
import { ProductCard } from '../../components/storefront/ProductCard';
import { RailScrollButton, VideoControl } from '../../components/storefront/StorefrontControls';

export const metadata = publicPageMetadata(
  'Huiles moteur au Maroc',
  'Des huiles moteur et lubrifiants automobiles sélectionnés pour les particuliers et les professionnels au Maroc.',
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
const heroImages = [
  {
    src: '/assets/Images/Petrom/xpro_extra_5l_fd42bd33.png',
    alt: 'Bidon Petrom XPRO Extra 20W-50, 5 L',
  },
  {
    src: '/assets/Images/Motul/motul_102889_8100_Eco_clean_5L_0W30_png_0961a7dd.png',
    alt: 'Bidon Motul 8100 ECO-CLEAN 0W-30, 5 L',
  },
  {
    src: '/assets/Images/Liqui_Moly/9507_Longtime_High_Tech_5W_30_5l_90fa_fa35c8e6.png',
    alt: 'Bidon Liqui Moly Longtime High Tech 5W-30, 5 L',
  },
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
              <p className="hero-intro">
                Des huiles moteur et lubrifiants automobiles sélectionnés pour répondre aux besoins
                des particuliers et des professionnels au Maroc.
              </p>
              <a className="button light" href="/catalogue">
                Explorer les huiles <span>↗</span>
              </a>
              <a className="hero-advice-link" href="/conseil">
                Demander conseil <span>↗</span>
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
              <a className="button primary" href="/a-propos">
                Découvrir ENRM <span>↗</span>
              </a>
            </div>
            <div id="hero-oils" className="hero-oils" aria-label="Huiles moteur en format 5 litres">
              {heroImages.map((image) => (
                <div className="hero-oil-item" key={image.src}>
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={370}
                    height={370}
                    fetchPriority="high"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="collection section" id="selection">
          <div className="section-heading">
            <div>
              <h2>
                Des marques reconnues.
                <br />
                Des références à explorer.
              </h2>
              <p>
                Retrouvez notre catalogue de lubrifiants automobiles, organisé par marque, viscosité
                et contenance.
              </p>
            </div>
            <a className="text-link" href="/#marques">
              Toutes les marques <span>↗</span>
            </a>
          </div>
          <RailControls id="featured-products" label="Produits" />
          <ProductRail id="featured-products" products={featured} label="Sélection de produits" />
          <div className="rail-foot">
            <span>
              Les prix et disponibilités sont confirmés par ENRM avant validation définitive de la
              commande.
            </span>
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
                L’exigence
                <br />
                du détail.
              </h2>
              <a className="button light" href="/catalogue">
                Explorer le catalogue <span>↗</span>
              </a>
            </div>
            <span className="detail-light-pass" aria-hidden="true"></span>
          </div>
        </section>
        <section className="collection section extra-collection" id="grade-530-section">
          <div className="section-heading">
            <h2>
              Le 5W-30.
              <br />
              Une viscosité, plusieurs formulations.
            </h2>
            <div>
              <p>
                Explorez nos références 5W-30 et comparez leurs caractéristiques pour identifier
                celles qui répondent aux préconisations de votre constructeur.
              </p>
              <a className="text-link" href="/catalogue?viscosity=5W-30&volume=5+L">
                Découvrir les huiles 5W-30 <span>↗</span>
              </a>
            </div>
          </div>
          <RailControls id="grade-530" label="Huiles 5W-30" />
          <ProductRail id="grade-530" products={grade530} label="Voir les huiles 5W-30" />
        </section>
        <section className="collection section atelier">
          <div className="section-heading">
            <div>
              <h2>
                À chaque besoin.
                <br />
                Son format.
              </h2>
            </div>
            <p>
              Du bidon pour l’entretien courant aux grands conditionnements destinés aux
              professionnels, explorez les formats disponibles chez ENRM.
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
                  Le bon format.
                  <br />
                  Pour chaque besoin.
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
              L’essentiel, à portée de main.
            </h2>
            <div>
              <p>
                Découvrez les références en format 1 litre pour l’entretien de votre véhicule, selon
                ses spécifications.
              </p>
              <a className="text-link" href="/catalogue?volume=1+L">
                Explorer les formats 1 L <span>↗</span>
              </a>
            </div>
          </div>
          <RailControls id="litre-products" label="Formats 1 L" />
          <ProductRail id="litre-products" products={litre} label="Explorer les formats 1 L" />
        </section>
        <section className="collection section extra-collection" id="grade-540-section">
          <div className="section-heading">
            <h2>
              Le 5W-40.
              <br />
              Le bon choix commence par les bonnes normes.
            </h2>
            <div>
              <p>
                Retrouvez nos huiles moteur 5W-40 et consultez les caractéristiques de chaque
                formulation.
              </p>
              <a className="text-link" href="/catalogue?viscosity=5W-40&volume=5+L">
                Découvrir les huiles 5W-40 <span>↗</span>
              </a>
            </div>
          </div>
          <RailControls id="grade-540" label="Huiles 5W-40" />
          <ProductRail id="grade-540" products={grade540} label="Voir les huiles 5W-40" />
        </section>
        <section className="choice-section section">
          <div>
            <h2>
              Trois engagements.
              <br />
              Une même exigence.
            </h2>
          </div>
          <div className="choice-list">
            <a href="/catalogue">
              <span>01</span>
              <div>
                <h3>Des références identifiées.</h3>
                <p>Un catalogue organisé par marque, formulation, viscosité et contenance.</p>
              </div>
              <span>↗</span>
            </a>
            <a href="/catalogue">
              <span>02</span>
              <div>
                <h3>Un conseil à votre écoute.</h3>
                <p>Notre équipe vous accompagne dans votre recherche et répond à vos questions.</p>
              </div>
              <span>↗</span>
            </a>
            <a href="/livraison">
              <span>03</span>
              <div>
                <h3>Une livraison adaptée.</h3>
                <p>
                  Livraison gratuite à Rabat et solutions vers d’autres villes, selon les conditions
                  confirmées.
                </p>
              </div>
              <span>↗</span>
            </a>
          </div>
        </section>
        <section className="collection section" id="livraison">
          <div className="section-heading">
            <div>
              <h2>
                Votre commande.
                <br />
                Livrée selon votre destination.
              </h2>
              <p>
                Profitez de la livraison gratuite à Rabat et dès 1 000 MAD de commande. Découvrez
                nos conditions pour Casablanca, Kénitra et les autres destinations desservies.
              </p>
            </div>
            <a className="text-link" href="/livraison">
              Voir les conditions de livraison <span>↗</span>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
