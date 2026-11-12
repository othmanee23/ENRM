import type { MetadataRoute } from 'next';
import { getPublicCatalogue, productSlug } from '../lib/catalogue';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://enrm.ma';
  const staticRoutes = [
    '',
    '/catalogue',
    '/conseil',
    '/contact',
    '/a-propos',
    '/livraison',
    '/retours',
    '/confidentialite',
    '/credits',
  ];
  const products = await getPublicCatalogue();
  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      changeFrequency: route === '/catalogue' ? ('daily' as const) : ('monthly' as const),
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/produits/${productSlug(product)}`,
      changeFrequency: 'weekly' as const,
    })),
  ];
}
