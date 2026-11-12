'use client';

import { useEffect } from 'react';

export function LegacyRuntime({ page }: { page: string }) {
  useEffect(() => {
    document.body.dataset.page = page;
    if (page === 'admin') {
      if (!window.location.hash) window.location.hash = 'categories';
      void import('../../admin/main');
      return;
    }
    void import('../../storefront/main');
  }, [page]);

  return null;
}
