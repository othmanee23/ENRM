import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://enrm.ma';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'ENRM — Solutions & Services', template: '%s — ENRM' },
  description:
    'Découvrez les références d’huiles moteur ENRM au Maroc. Comparez les formulations et les conditionnements, puis envoyez votre demande à notre équipe.',
  applicationName: 'ENRM',
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    siteName: 'ENRM',
    title: 'ENRM — Solutions & Services',
    description: 'Les références et conditionnements d’huiles moteur ENRM au Maroc.',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
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
