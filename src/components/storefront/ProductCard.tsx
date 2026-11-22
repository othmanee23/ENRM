import type { Product } from '../../shared/types';
import { brandName, formatMad } from '../../shared/format';
import { productSlug } from '../../shared/slugs';
import { resolveMediaUrl } from '../../lib/seo';
import { getBundledProductById } from '../../shared/catalogue-assets';
import { AddToCartButton } from './AddToCartButton';
import { ProductAvailabilityBadge } from './ProductAvailabilityBadge';

export function ProductCard({ product }: { product: Product }) {
  const title = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const href = `/produits/${productSlug(product)}`;
  const bundledProduct = getBundledProductById(product.id);
  const imageProduct = bundledProduct?.recto ? bundledProduct : product;
  const image = imageProduct ? resolveMediaUrl(imageProduct.recto) : null;
  const brandSlugs: Record<string, string> = {
    castrol: 'castrol',
    liqui_moly: 'liqui-moly',
    motul: 'motul',
    petrom: 'petrom',
    shell: 'shell',
    totalenergies: 'totalenergies',
  };
  const brandSlug = brandSlugs[product.marque.toLowerCase()];
  return (
    <article className="product-card">
      <a className="product-image" href={href}>
        <span className="image-tag">{product.litrage}</span>
        <ProductAvailabilityBadge productId={product.id} />
        {image ? (
          <img src={image} alt={title} loading="lazy" width={370} height={370} />
        ) : (
          <div className="placeholder">
            <b>{product.litrage}</b>
            <span>Photo non disponible</span>
          </div>
        )}
        <span className="image-arrow" aria-hidden="true">
          ↗
        </span>
      </a>
      <div className="card-copy">
        <p className="product-brand">
          {brandSlug ? (
            <a href={`/marques/${brandSlug}`}>{brandName(product.marque)}</a>
          ) : (
            brandName(product.marque)
          )}
        </p>
        <h3>
          <a href={href}>{product.sous_reference}</a>
        </h3>
        <p className="product-meta">
          {product.viscosite} <span>·</span> {product.litrage}
        </p>
        <div className="product-price">
          <span>{product.price > 0 ? `${formatMad(product.price)} MAD` : 'Prix à confirmer'}</span>
          <AddToCartButton id={product.id} label={`Ajouter ${title} à ma demande`} />
        </div>
      </div>
    </article>
  );
}
