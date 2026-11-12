import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { LegacyPage } from '../../../../components/legacy/LegacyPage';
import {
  getPublicProductBySlug,
  getPublicProductContext,
  productSlug,
} from '../../../../lib/catalogue';
import { renderLegacyProduct } from '../../../../lib/legacy-render';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return { title: 'Référence introuvable', robots: { index: false, follow: false } };
  const title = `${product.marque.replaceAll('_', ' ')} ${product.sous_reference} ${product.viscosite} ${product.litrage}`;
  const description =
    product.designation?.trim() ||
    `${title} — référence de catalogue ENRM au Maroc. Envoyez votre demande pour confirmer la disponibilité et le prix.`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `/produits/${productSlug(product)}` },
    openGraph: {
      type: 'website',
      title,
      description: description.slice(0, 160),
      images: product.recto ? [`/${product.recto.replace(/^\//, '')}`] : [],
    },
    twitter: {
      card: product.recto ? 'summary_large_image' : 'summary',
      title,
      description: description.slice(0, 160),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();
  const canonicalSlug = productSlug(product);
  if (slug !== canonicalSlug) permanentRedirect(`/produits/${canonicalSlug}`);
  const products = await getPublicProductContext(product);
  const html = renderLegacyProduct(product, products);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.marque.replaceAll('_', ' ')} ${product.sous_reference} ${product.viscosite} ${product.litrage}`,
    description: product.designation || undefined,
    sku: product.id,
    brand: { '@type': 'Brand', name: product.marque.replaceAll('_', ' ') },
    image: product.recto
      ? [
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://enrm.ma'}/${product.recto.replace(/^\//, '')}`,
        ]
      : undefined,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://enrm.ma'}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalogue',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://enrm.ma'}/catalogue`,
      },
      { '@type': 'ListItem', position: 3, name: product.sous_reference },
    ],
  };
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
      <LegacyPage name="product" html={html} />
      <script
        id="product-bootstrap"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ products }).replace(/</g, '\\u003c') }}
      />
    </>
  );
}
