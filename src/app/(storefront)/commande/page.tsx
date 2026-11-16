import type { Metadata } from 'next';
import { CheckoutClient } from '../../../components/storefront/CheckoutClient';
import { hasSupabaseConfig } from '../../../lib/catalogue';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Envoyer une demande de commande',
  robots: { index: false, follow: false },
};
export default function CheckoutPage() {
  return <CheckoutClient supabaseConfigured={hasSupabaseConfig} />;
}
