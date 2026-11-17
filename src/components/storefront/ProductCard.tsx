import type { Product } from '../../shared/types';
import { brandName, formatMad } from '../../shared/format';
import { productSlug } from '../../shared/slugs';
import { resolveMediaUrl } from '../../lib/seo';
import { AddToCartButton } from './AddToCartButton';

export function ProductCard({ product }: { product: Product }) {
  const title = `${brandName(product.marque)} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const href = `/produits/${productSlug(product)}`;
  const image = product.statut_recto.includes('générique') ? null : resolveMediaUrl(product.recto);
  return (
    <article className="product-card">
      <a className="product-image" href={href}>
        <span className="image-tag">
          {product.statut_recto.includes('générique') ? 'Visuel à valider' : product.litrage}
        </span>
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
        <p className="product-brand">{brandName(product.marque)}</p>
        <h3>
          <a href={href}>{product.sous_reference}</a>
        </h3>
        <p className="product-meta">
          {product.viscosite} <span>·</span> {product.litrage}
        </p>
        <div className="product-price">
          <span>{formatMad(product.price)} MAD</span>
          <AddToCartButton id={product.id} label={`Ajouter ${title} à ma demande`} />
        </div>
      </div>
    </article>
  );
}
