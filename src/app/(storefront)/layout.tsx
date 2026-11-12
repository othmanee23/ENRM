import type { ReactNode } from 'react';
import { StorefrontChrome } from '../../components/storefront/StorefrontChrome';
import { StorefrontRuntime } from '../../components/storefront/StorefrontRuntime';

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StorefrontRuntime />
      <StorefrontChrome>{children}</StorefrontChrome>
    </>
  );
}
