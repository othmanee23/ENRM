import type { MetadataRoute } from 'next';
import { getPublicCatalogue, productSlug } from '../lib/catalogue';
import { blogPosts } from '../lib/blog';
import { getSiteUrl } from '../lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticRoutes = [
    '',
    '/catalogue',
    '/blogs',
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
      url: new URL(route, siteUrl).href,
      changeFrequency: route === '/catalogue' ? ('daily' as const) : ('monthly' as const),
    })),
    ...products.map((product) => ({
      url: new URL(`/produits/${productSlug(product)}`, siteUrl).href,
      changeFrequency: 'weekly' as const,
    })),
    ...blogPosts.map((post) => ({
      url: new URL(`/blogs/${post.slug}`, siteUrl).href,
      lastModified: new Date(`${post.publishedAt}T12:00:00Z`),
      changeFrequency: 'monthly' as const,
    })),
  ];
}
