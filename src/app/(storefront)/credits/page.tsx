import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
export const metadata: Metadata = {
  title: 'Crédits médias',
  description: 'Crédits et attributions des médias utilisés par ENRM.',
};
export default function Page() {
  return <LegacyPage name="credits" />;
}
