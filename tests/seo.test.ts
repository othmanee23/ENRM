import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveMediaUrl, shouldIndexSite } from '../src/lib/seo';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('media URL resolution', () => {
  it('keeps secure Supabase Storage URLs intact', () => {
    const storageUrl =
      'https://project.supabase.co/storage/v1/object/public/products/front%20label.jpg';
    expect(resolveMediaUrl(storageUrl)).toBe(storageUrl);
  });

  it('normalizes local asset paths and encodes path segments', () => {
    expect(resolveMediaUrl('/assets/Images/front label.jpg')).toBe(
      '/assets/Images/front%20label.jpg',
    );
    expect(resolveMediaUrl('assets/media/front.jpg')).toBe('/assets/media/front.jpg');
  });

  it.each([
    '//attacker.example/image.jpg',
    'javascript:alert(1)',
    '../secret.jpg',
    'http://attacker.example/image.jpg',
  ])('rejects unsafe image source %s', (source) => {
    expect(resolveMediaUrl(source)).toBeNull();
  });
});

describe('production indexing gate', () => {
  it.each(['https://enrm.ma', 'https://www.enrm.ma'])('allows indexing for %s', (siteUrl) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
    expect(shouldIndexSite()).toBe(true);
  });

  it.each(['http://enrm.ma', 'https://preview.enrm.ma', 'http://localhost:3000', 'invalid'])(
    'keeps %s out of search indexing',
    (siteUrl) => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
      expect(shouldIndexSite()).toBe(false);
    },
  );

  it('keeps indexing disabled when the site URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(shouldIndexSite()).toBe(false);
  });
});
