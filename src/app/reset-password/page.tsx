import type { Metadata } from 'next';
import { AdminPasswordResetForm } from '../../components/admin/AdminPasswordResetForm';
import '../../styles/admin.css';
import '../../styles/admin-login.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Nouveau mot de passe administrateur',
  robots: { index: false, follow: false, noarchive: true },
};

export default function ResetPasswordPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
  return <AdminPasswordResetForm configured={configured} />;
}
