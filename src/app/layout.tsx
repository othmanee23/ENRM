import type { Metadata, Viewport } from 'next';
import { DEFAULT_SOCIAL_IMAGE, getSiteUrl, shouldIndexSite } from '../lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'ENRM — Solutions & Services', template: '%s — ENRM' },
  description:
    'Découvrez les références d’huiles moteur ENRM au Maroc. Comparez les formulations et les conditionnements, puis envoyez votre demande à notre équipe.',
  applicationName: 'ENRM',
  alternates: { canonical: '/' },
  robots: { index: shouldIndexSite(), follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    siteName: 'ENRM',
    title: 'ENRM — Solutions & Services',
    description: 'Les références et conditionnements d’huiles moteur ENRM au Maroc.',
    url: '/',
    images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: 'ENRM — huiles moteur au Maroc' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ENRM — Solutions & Services',
    description: 'Les références et conditionnements d’huiles moteur ENRM au Maroc.',
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: '#091e29',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body data-page="site">{children}</body>
    </html>
  );
}
