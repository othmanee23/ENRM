import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ProductCard } from '../../../../components/storefront/ProductCard';
import {
  getPublicProductBySlug,
  getPublicProductContext,
  productSlug,
} from '../../../../lib/catalogue';
import { brandName, formatMad } from '../../../../shared/format';
import {
  DEFAULT_SOCIAL_IMAGE,
  getSiteUrl,
  publicPageMetadata,
  resolveMediaUrl,
} from '../../../../lib/seo';
import { AddToCartButton } from '../../../../components/storefront/AddToCartButton';
import { ProductGallery } from '../../../../components/storefront/StorefrontControls';
import { getBundledProductById } from '../../../../shared/catalogue-assets';
import { productIdFromSlug } from '../../../../shared/slugs';
import { hasApprovedProductImage } from '../../../../lib/catalogue-image-policy';
import { getVerifiedProductSpecifications } from '../../../../lib/verified-product-specs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  const bundledProduct = product ?? getBundledProductById(productIdFromSlug(slug) || '');
  if (!bundledProduct)
    return { title: 'Référence introuvable', robots: { index: false, follow: false } };
  const title = `${brandName(bundledProduct.marque)} ${bundledProduct.sous_reference} ${bundledProduct.viscosite} — ${bundledProduct.litrage}`;
  if (!product) {
    const image =
      (hasApprovedProductImage(bundledProduct) && resolveMediaUrl(bundledProduct.recto)) ||
      DEFAULT_SOCIAL_IMAGE;
    return {
      title: `${title} — Référence indisponible | ENRM`,
      description: 'Cette référence ne figure plus au catalogue ENRM.',
      robots: { index: false, follow: true },
      openGraph: { images: [{ url: image, alt: title }] },
    };
  }
  const description = `Référence ${title} au catalogue ENRM. Vérifiez les spécifications du fabricant et les préconisations du constructeur. Prix et disponibilité à confirmer.`;
  const bundledImage =
    bundledProduct && hasApprovedProductImage(bundledProduct)
      ? resolveMediaUrl(bundledProduct.recto)
      : null;
  const image = bundledImage || DEFAULT_SOCIAL_IMAGE;
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
  if (!product) {
    const bundledProduct = getBundledProductById(productIdFromSlug(slug) || '');
    if (!bundledProduct) notFound();
    const image = hasApprovedProductImage(bundledProduct)
      ? resolveMediaUrl(bundledProduct.recto)
      : null;
    return (
      <main id="main" className="section cart-page">
        <div className="product-breadcrumb">
          <a href="/catalogue">← Revenir au catalogue</a>
          <span>Référence indisponible</span>
        </div>
        <section className="product-layout">
          <div className="detail-visual">
            <ProductGallery
              recto={image}
              verso={null}
              alt={`${bundledProduct.marque} ${bundledProduct.sous_reference}`}
            />
            <p className="media-caption">Visuel du conditionnement {bundledProduct.litrage}.</p>
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{brandName(bundledProduct.marque)}</p>
            <h1>
              {bundledProduct.sous_reference}
              <span>{bundledProduct.viscosite}</span>
            </h1>
            <p className="detail-reference">{bundledProduct.id} · Référence retirée du catalogue</p>
            <p>Cette référence n’est plus disponible dans le catalogue ENRM.</p>
            <a className="button primary" href="/catalogue">
              Voir le catalogue <span>↗</span>
            </a>
          </div>
        </section>
      </main>
    );
  }
  const canonicalSlug = productSlug(product);
  if (slug !== canonicalSlug) permanentRedirect(`/produits/${canonicalSlug}`);

  const relatedContext = await getPublicProductContext(product);
  const products = [product, ...relatedContext.filter((item) => item.id !== product.id)];
  const variants = relatedContext.filter(
    (candidate) =>
      candidate.marque === product.marque &&
      candidate.gamme === product.gamme &&
      candidate.sous_reference === product.sous_reference &&
      candidate.viscosite === product.viscosite,
  );
  const volumeVariants = [product, ...variants.filter((item) => item.id !== product.id)].filter(
    (variant, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.litrage.trim().toLocaleLowerCase().replace(/\s+/g, '') ===
          variant.litrage.trim().toLocaleLowerCase().replace(/\s+/g, ''),
      ) === index,
  );
  const related = relatedContext
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.marque === product.marque &&
        candidate.recto &&
        !(
          candidate.gamme === product.gamme &&
          candidate.sous_reference === product.sous_reference &&
          candidate.viscosite === product.viscosite
        ),
    )
    .sort((a, b) => {
      const score = (candidate: (typeof relatedContext)[number]) =>
        Number(candidate.gamme === product.gamme) * 4 +
        Number(candidate.viscosite === product.viscosite) * 2 +
        Number(candidate.sous_reference === product.sous_reference);
      return score(b) - score(a);
    })
    .slice(0, 4);
  const bundledProduct = getBundledProductById(product.id);
  const staticImageProduct = bundledProduct ?? product;
  const bundledImage = hasApprovedProductImage(staticImageProduct)
    ? resolveMediaUrl(staticImageProduct.recto)
    : null;
  const image = bundledImage;
  const siteUrl = getSiteUrl();
  const productName = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} — ${product.litrage}`;
  const verifiedSpecifications = getVerifiedProductSpecifications(product.id);
  const specificationProperties = verifiedSpecifications
    ? [
        ['Normes industrielles', verifiedSpecifications.standards],
        ['Homologations fabricant', verifiedSpecifications.approvals],
        ['Répond aux exigences', verifiedSpecifications.meets],
        ['Recommandations fabricant', verifiedSpecifications.recommendations],
        ['Convient pour', verifiedSpecifications.suitableFor],
        ['Rétrocompatibilité indiquée', verifiedSpecifications.backwardCompatible],
        ['Performances indiquées', verifiedSpecifications.performance],
      ].flatMap(
        ([name, values]) =>
          (values as string[] | undefined)?.map((value) => ({
            '@type': 'PropertyValue',
            name: name as string,
            value,
          })) ?? [],
      )
    : [];
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: product.designation || undefined,
    sku: product.id,
    category: 'Huiles moteur',
    brand: { '@type': 'Brand', name: brandName(product.marque) },
    image: image ? [new URL(image, siteUrl).href] : undefined,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Grade SAE', value: product.viscosite },
      { '@type': 'PropertyValue', name: 'Contenance', value: product.litrage },
      ...(product.gamme ? [{ '@type': 'PropertyValue', name: 'Gamme', value: product.gamme }] : []),
      ...specificationProperties,
    ],
    ...(product.price > 0
      ? {
          offers: {
            '@type': 'Offer',
            url: new URL(`/produits/${canonicalSlug}`, siteUrl).href,
            priceCurrency: 'MAD',
            price: product.price,
            seller: { '@type': 'Organization', name: 'ENRM Solutions & Services' },
          },
        }
      : {}),
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
      {
        '@type': 'ListItem',
        position: 3,
        name: product.sous_reference,
        item: new URL(`/produits/${canonicalSlug}`, siteUrl).href,
      },
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
              <ProductGallery recto={image} verso={null} alt={productName} />
              <p className="media-caption">
                {image
                  ? `Visuel du conditionnement ${product.litrage}.`
                  : 'Aucune photographie vérifiée n’est disponible pour cette référence.'}
              </p>
            </div>
            <div className="detail-copy">
              <p className="eyebrow">{brandName(product.marque)}</p>
              <h1>
                {product.sous_reference}
                <span>{product.viscosite}</span>
              </h1>
              <p className="detail-reference">{product.id} · Disponibilité à confirmer</p>
              <p className="detail-price">
                {product.price > 0 ? `${formatMad(product.price)} MAD` : 'Prix à confirmer'}
              </p>
              <fieldset className="variant-fieldset">
                <legend>Votre contenance</legend>
                <div className="volume-options">
                  {volumeVariants.map((variant) => (
                    <a
                      href={`/produits/${productSlug(variant)}`}
                      className={variant.id === product.id ? 'selected' : undefined}
                      aria-current={variant.id === product.id ? 'true' : undefined}
                      key={variant.id}
                    >
                      {variant.litrage}
                    </a>
                  ))}
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
                  label="Ajouter cette référence à ma demande"
                  className="button primary"
                  quantityFieldId="detail-qty"
                >
                  Ajouter à ma demande <span>＋</span>
                </AddToCartButton>
              </div>
              <p className="muted">
                Prix indicatif. ENRM confirmera le prix final et la disponibilité. Aucun paiement en
                ligne n’est demandé.
              </p>
              <a href="/contact" className="detail-advice">
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
              <section className="verified-specifications" aria-labelledby="verified-specs-title">
                <h3 id="verified-specs-title">Normes et homologations fabricant</h3>
                {verifiedSpecifications ? (
                  <>
                    <p className="muted">
                      Relevées sur la fiche officielle du fabricant. Vérifiez toujours les exigences
                      exactes indiquées dans le manuel de votre véhicule.
                    </p>
                    {verifiedSpecifications.standards.length > 0 && (
                      <div>
                        <h4>Normes industrielles</h4>
                        <ul>
                          {verifiedSpecifications.standards.map((value) => (
                            <li key={value}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifiedSpecifications.approvals && (
                      <div>
                        <h4>Homologations fabricant</h4>
                        <ul>
                          {verifiedSpecifications.approvals.map((value) => (
                            <li key={value}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifiedSpecifications.meets && (
                      <div>
                        <h4>Répond aux exigences</h4>
                        <ul>
                          {verifiedSpecifications.meets.map((value) => (
                            <li key={value}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifiedSpecifications.recommendations && (
                      <div>
                        <h4>Recommandations du fabricant</h4>
                        <ul>
                          {verifiedSpecifications.recommendations.map((value) => (
                            <li key={value}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifiedSpecifications.suitableFor && (
                      <div>
                        <h4>Convient pour</h4>
                        <ul>
                          {verifiedSpecifications.suitableFor.map((value) => (
                            <li key={value}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifiedSpecifications.backwardCompatible && (
                      <div>
                        <h4>Rétrocompatibilité indiquée</h4>
                        <ul>
                          {verifiedSpecifications.backwardCompatible.map((value) => (
                            <li key={value}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifiedSpecifications.performance && (
                      <div>
                        <h4>Performances indiquées par le fabricant</h4>
                        <ul>
                          {verifiedSpecifications.performance.map((value) => (
                            <li key={value}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <a
                      className="text-link"
                      href={verifiedSpecifications.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Source officielle : {verifiedSpecifications.sourceLabel}
                    </a>
                  </>
                ) : (
                  <p className="muted">
                    Les données fabricant de cette référence sont en cours de vérification. ENRM
                    peut confirmer les spécifications à partir de l’emballage et de la fiche
                    technique.
                  </p>
                )}
              </section>
              <p>{product.designation}</p>
              <p className="muted">
                La viscosité seule ne prouve pas la compatibilité. Lorsque des normes sont
                affichées, comparez-les avec les exigences du manuel de votre véhicule.
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
          <section className="product-faq section" aria-labelledby="product-faq-title">
            <p className="eyebrow">QUESTIONS FRÉQUENTES</p>
            <h2 id="product-faq-title">À savoir avant de choisir.</h2>
            <div className="product-faq-list">
              <details>
                <summary>Comment vérifier que cette huile convient à mon véhicule&nbsp;?</summary>
                <p>
                  Comparez le grade SAE et les normes ou homologations indiqués ici avec le manuel
                  d’entretien de votre véhicule. La viscosité seule ne confirme pas la
                  compatibilité. Si vous avez un doute, transmettez-nous la marque, le modèle,
                  l’année et la motorisation.
                </p>
              </details>
              <details>
                <summary>Comment choisir la bonne contenance&nbsp;?</summary>
                <p>
                  La capacité requise dépend du moteur et de l’opération d’entretien. Vérifiez le
                  manuel de votre véhicule, puis sélectionnez un format proposé dans les variantes
                  de cette référence.
                </p>
              </details>
              <details>
                <summary>Le prix et la disponibilité affichés sont-ils définitifs&nbsp;?</summary>
                <p>
                  Les prix du catalogue sont mis à jour à partir des informations saisies par ENRM.
                  Notre équipe confirme le prix final et la disponibilité lorsque vous envoyez votre
                  demande. Aucun paiement en ligne n’est demandé.
                </p>
              </details>
            </div>
            <a className="button primary" href="/contact">
              Demander conseil
            </a>
          </section>
          <section className="section related-section">
            <div className="section-heading">
              <h2>
                {related.some((item) => item.gamme === product.gamme)
                  ? 'Dans la même gamme.'
                  : 'Autres huiles de la marque.'}
              </h2>
              <a href="/catalogue" className="text-link">
                Toutes les huiles ↗
              </a>
            </div>
            <p className="muted">
              Les références proches facilitent la comparaison, mais ne garantissent pas une
              compatibilité avec votre véhicule. Vérifiez toujours les préconisations du
              constructeur.
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
