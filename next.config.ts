import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: 'https',
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/catalogue.html', destination: '/catalogue', permanent: true },
      { source: '/conseil.html', destination: '/conseil', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/a-propos.html', destination: '/a-propos', permanent: true },
      { source: '/livraison.html', destination: '/livraison', permanent: true },
      { source: '/retours.html', destination: '/retours', permanent: true },
      { source: '/confidentialite.html', destination: '/confidentialite', permanent: true },
      { source: '/credits.html', destination: '/credits', permanent: true },
      { source: '/admin.html', destination: '/admin', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
    ];
  },
};

export default nextConfig;
