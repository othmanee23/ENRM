import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Contact',
  'Contactez ENRM pour obtenir des renseignements sur le catalogue et votre demande de commande.',
  '/contact',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">NOUS CONTACTER</p>
        <h1>Prenons le temps d’en parler.</h1>
        <div className="info-content">
          <h2>Une référence à retrouver ?</h2>
          <p>
            Préparez votre véhicule, sa motorisation ou la référence recherchée. Le parcours de
            conseil vous permet de composer et de relire une demande.
          </p>
          <a className="button primary" href="/conseil">
            Préparer ma demande ↗
          </a>
          <h2>Les coordonnées arrivent.</h2>
          <p>
            Le téléphone, l’adresse, les horaires et le numéro WhatsApp ENRM ne sont pas encore
            renseignés. Aucun contact fictif n’est affiché et aucune demande n’est envoyée depuis
            cette démonstration.
          </p>
        </div>
      </section>
    </main>
  );
}
