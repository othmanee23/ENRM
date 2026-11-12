import type { Metadata } from 'next';
import { LegacyPage } from '../../../components/legacy/LegacyPage';
export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez ENRM pour obtenir des renseignements sur le catalogue et votre demande de commande.',
};
export default function Page() {
  return <LegacyPage name="contact" />;
}
