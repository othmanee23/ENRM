import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
export const metadata: Metadata = {
  title: 'À propos d’ENRM',
  description: 'Découvrez ENRM, Solutions & Services.',
};
export default function Page() {
  return <LegacyPage name="a-propos" />;
}
