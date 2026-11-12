import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
export const metadata: Metadata = {
  title: 'Retours et conditions',
  description: 'Consultez les informations ENRM sur les retours et conditions de vente.',
};
export default function Page() {
  return <LegacyPage name="retours" />;
}
