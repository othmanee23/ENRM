import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '../../components/admin/AdminLoginForm';
import { getAdminAuthStatus } from '../../lib/supabase/auth';
import '../../styles/admin.css';
import '../../styles/admin-login.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Connexion administrateur',
  robots: { index: false, follow: false, noarchive: true },
};

type SearchParams = Record<string, string | string[] | undefined>;
function safeAdminPath(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || value.startsWith('//') || value.includes('\\'))
    return '/admin#overview';
  return /^\/admin(?:[/?#]|$)/.test(value) ? value : '/admin#overview';
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const authStatus = await getAdminAuthStatus();
  if (authStatus === 'admin') redirect('/admin#overview');

  const reason = typeof params.reason === 'string' ? params.reason : '';
  const notice =
    reason === 'admin' || authStatus === 'forbidden'
      ? 'Ce compte ne dispose pas du rôle administrateur ENRM.'
      : reason === 'password-updated'
        ? 'Votre mot de passe a été modifié. Connectez-vous avec votre nouveau mot de passe.'
        : reason === 'verify' || authStatus === 'unavailable'
          ? 'La session ou le rôle administrateur n’a pas pu être vérifié. Réessayez.'
          : '';
  const configured = authStatus !== 'unconfigured';

  return (
    <>
      <AdminLoginForm
        nextPath={safeAdminPath(params.next)}
        configured={configured}
        notice={notice}
      />
    </>
  );
}
