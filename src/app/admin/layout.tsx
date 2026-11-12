import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAdminAuthStatus } from '../../lib/supabase/auth';
import '../../styles/admin.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { default: 'Espace de gestion', template: '%s — ENRM Gestion' },
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authStatus = await getAdminAuthStatus();
  if (authStatus !== 'admin') {
    const reason =
      authStatus === 'unconfigured'
        ? 'config'
        : authStatus === 'forbidden'
          ? 'admin'
          : authStatus === 'unavailable'
            ? 'verify'
            : '';
    redirect(reason ? `/login?reason=${reason}` : '/login');
  }
  return children;
}
