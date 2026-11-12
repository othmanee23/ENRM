import type { Metadata } from 'next';

export const DEFAULT_SOCIAL_IMAGE = '/assets/media/hero-oil-poster.jpg';
const DEFAULT_SITE_URL = 'https://enrm.ma/';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;

  try {
    const url = new URL(configured);
    if (url.protocol === 'https:' || url.protocol === 'http:') return `${url.origin}/`;
  } catch {
    // Keep metadata URLs valid if a deployment variable is malformed.
  }

  return DEFAULT_SITE_URL;
}

export function shouldIndexSite(): boolean {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return false;

  try {
    const url = new URL(configured);
    return (
      url.protocol === 'https:' && ['enrm.ma', 'www.enrm.ma'].includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function resolveMediaUrl(value?: string | null): string | null {
  const source = value?.trim();
  if (!source || source.startsWith('//')) return null;

  try {
    const url = new URL(source);
    if (url.protocol === 'https:') return url.href;
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) {
      return url.href;
    }
    return null;
  } catch {
    // Relative asset paths are resolved below.
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(source)) return null;
  const segments = source.replace(/\\/g, '/').split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  return `/${segments.map(encodeURIComponent).join('/')}`;
}

export function publicPageMetadata(
  title: string,
  description: string,
  canonical: string,
  image = DEFAULT_SOCIAL_IMAGE,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'fr_MA',
      siteName: 'ENRM',
      title,
      description,
      url: canonical,
      images: [{ url: image, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
