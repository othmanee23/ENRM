import type { Metadata } from 'next';
import { CartClient } from '../../../components/storefront/CartClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Panier', robots: { index: false, follow: false } };
export default function CartPage() {
  return <CartClient />;
}
