import type { ReactNode } from 'react';
import { StorefrontChrome } from '../../components/storefront/StorefrontChrome';
import { CartProvider } from '../../components/storefront/CartProvider';
import { StorefrontEffects } from '../../components/storefront/StorefrontControls';

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <StorefrontChrome>{children}</StorefrontChrome>
      <StorefrontEffects />
    </CartProvider>
  );
}
