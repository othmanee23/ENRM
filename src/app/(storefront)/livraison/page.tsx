import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
export const metadata: Metadata = {
  title: 'Livraison',
  description:
    'Informations de livraison ENRM au Maroc. Les conditions finales sont confirmées avec le client.',
};
export default function Page() {
  return <LegacyPage name="livraison" />;
}
