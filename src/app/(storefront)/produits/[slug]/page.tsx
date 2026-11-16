import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ProductCard } from '../../../../components/storefront/ProductCard';
import {
  getPublicProductBySlug,
  getPublicProductContext,
  productSlug,
  formatMad,
} from '../../../../lib/catalogue';
import {
  DEFAULT_SOCIAL_IMAGE,
  getSiteUrl,
  publicPageMetadata,
  resolveMediaUrl,
} from '../../../../lib/seo';
import { brandName } from '../../../../shared/format';
import { AddToCartButton } from '../../../../components/storefront/AddToCartButton';
import { ProductGallery } from '../../../../components/storefront/StorefrontControls';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return { title: 'Référence introuvable', robots: { index: false, follow: false } };
  const title = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const description =
    product.designation?.trim() ||
    `${title} — référence de catalogue ENRM au Maroc. Envoyez votre demande pour confirmer la disponibilité et le prix.`;
  const image = resolveMediaUrl(product.recto) || DEFAULT_SOCIAL_IMAGE;
  return publicPageMetadata(
    title,
    description.slice(0, 160),
    `/produits/${productSlug(product)}`,
    image,
  );
}

function safeSource(value: string): string | undefined {
  const candidate = value.split(' | ')[0]?.trim();
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();
  const canonicalSlug = productSlug(product);
  if (slug !== canonicalSlug) permanentRedirect(`/produits/${canonicalSlug}`);

  const relatedContext = await getPublicProductContext(product);
  const products = [product, ...relatedContext.filter((item) => item.id !== product.id)];
  const variants = relatedContext.filter(
    (candidate) =>
      candidate.marque === product.marque &&
      candidate.gamme === product.gamme &&
      candidate.viscosite === product.viscosite,
  );
  const related = relatedContext
    .filter(
      (candidate) =>
        candidate.id !== product.id && candidate.marque === product.marque && candidate.recto,
    )
    .slice(0, 4);
  const image = resolveMediaUrl(product.recto);
  const siteUrl = getSiteUrl();
  const productName = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: product.designation || undefined,
    sku: product.id,
    brand: { '@type': 'Brand', name: brandName(product.marque) },
    image: image ? [new URL(image, siteUrl).href] : undefined,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalogue',
        item: new URL('/catalogue', siteUrl).href,
      },
      { '@type': 'ListItem', position: 3, name: product.sous_reference },
    ],
  };
  const source = safeSource(product.source_recto || product.preuves_maroc);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <main id="main">
        <div id="product-page" aria-live="polite">
          <div className="product-breadcrumb">
            <a href="/catalogue" id="back-catalogue">
              ← Revenir au catalogue
            </a>
            <span>
              {brandName(product.marque)} / {product.sous_reference}
            </span>
          </div>
          <section className="product-layout">
            <div className="detail-visual">
              <ProductGallery
                recto={image}
                verso={resolveMediaUrl(product.verso)}
                alt={productName}
              />
              <p className="media-caption">
                {product.recto
                  ? product.statut_recto.includes('générique')
                    ? 'Illustration générique du contenant.'
                    : `Visuel du conditionnement ${product.litrage}.`
                  : 'La photo exacte de cette variante reste à compléter.'}
              </p>
            </div>
            <div className="detail-copy">
              <p className="eyebrow">{brandName(product.marque)}</p>
              <h1>
                {product.sous_reference}
                <span>{product.viscosite}</span>
              </h1>
              <p className="detail-reference">{product.id} · Disponibilité à confirmer</p>
              <div className="detail-price">{formatMad(product.price)}</div>
              <p className="muted">Prix indicatif pour {product.litrage} · à confirmer par ENRM</p>
              <fieldset className="variant-fieldset">
                <legend>Votre contenance</legend>
                <div className="volume-options">
                  {[product, ...variants.filter((item) => item.id !== product.id)].map(
                    (variant) => (
                      <a
                        href={`/produits/${productSlug(variant)}`}
                        className={variant.id === product.id ? 'selected' : undefined}
                        aria-current={variant.id === product.id ? 'true' : undefined}
                        key={variant.id}
                      >
                        {variant.litrage}
                      </a>
                    ),
                  )}
                </div>
              </fieldset>
              <div className="buy-line">
                <label>
                  Quantité
                  <input
                    className="quantity"
                    id="detail-qty"
                    type="number"
                    defaultValue={1}
                    min={1}
                    max={99}
                  />
                </label>
                <AddToCartButton
                  id={product.id}
                  label="Ajouter au panier"
                  className="button primary"
                  quantityFieldId="detail-qty"
                >
                  Ajouter au panier <span>＋</span>
                </AddToCartButton>
              </div>
              <p className="muted">
                Votre demande sera confirmée par ENRM. Aucun paiement en ligne.
              </p>
              <a href="/#conseil" className="detail-advice">
                Un doute sur votre moteur ? <span>Parlons-en ↗</span>
              </a>
              <div className="product-service">
                <span>Conditionnement exact</span>
                <span>Référence identifiable</span>
              </div>
            </div>
          </section>
          <section className="product-specs section">
            <div>
              <p className="eyebrow">CHAQUE DÉTAIL COMPTE</p>
              <h2>
                La référence,
                <br />
                en toute clarté.
              </h2>
            </div>
            <div>
              <dl>
                <div>
                  <dt>Marque</dt>
                  <dd>{brandName(product.marque)}</dd>
                </div>
                <div>
                  <dt>Gamme</dt>
                  <dd>{product.gamme}</dd>
                </div>
                <div>
                  <dt>Sous-référence</dt>
                  <dd>{product.sous_reference}</dd>
                </div>
                <div>
                  <dt>Grade SAE</dt>
                  <dd>{product.viscosite}</dd>
                </div>
                <div>
                  <dt>Contenance</dt>
                  <dd>{product.litrage}</dd>
                </div>
                <div>
                  <dt>Référence fabricant</dt>
                  <dd>{product.references_articles || 'À confirmer'}</dd>
                </div>
              </dl>
              <p>{product.designation}</p>
              <p className="muted">
                La viscosité seule ne prouve pas la compatibilité. Vérifiez les normes et
                homologations avec la documentation du constructeur et du fabricant.
              </p>
              {source && (
                <a className="text-link" href={source} target="_blank" rel="noopener noreferrer">
                  Consulter la source catalogue ↗
                </a>
              )}
              <p className="muted">
                Prix, stock, frais de livraison et version d’emballage à valider avant publication.
              </p>
            </div>
          </section>
          <section className="section related-section">
            <div className="section-heading">
              <h2>Poursuivre la découverte.</h2>
              <a href="/catalogue" className="text-link">
                Toutes les huiles ↗
              </a>
            </div>
            <p className="muted">
              Autres références de la marque. Ces produits ne sont pas des substituts techniques.
            </p>
            <div className="product-rail">
              {related.map((item) => (
                <ProductCard product={item} key={item.id} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
