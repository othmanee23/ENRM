import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
export const metadata: Metadata = {
  title: 'Confidentialité',
  description:
    'Comment ENRM utilise les informations communiquées pour traiter une demande de commande.',
};
export default function Page() {
  return <LegacyPage name="confidentialite" />;
}
