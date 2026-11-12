import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
export const metadata: Metadata = {
  title: 'Conseil moteur',
  description: 'Préparez les informations sur votre véhicule pour demander conseil à ENRM.',
};
export default function Page() {
  return <LegacyPage name="conseil" />;
}
