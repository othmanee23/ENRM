import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Contact',
  'Parcourez le catalogue ENRM et transmettez une demande de commande. Les coordonnées publiques restent à compléter.',
  '/contact',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">NOUS CONTACTER</p>
        <h1>Prenons le temps d’en parler.</h1>
        <div className="info-content">
          <h2>Une référence à retrouver&nbsp;?</h2>
          <p>
            Vous pouvez transmettre une demande de commande depuis le catalogue. Indiquez les
            références voulues et vos coordonnées; ENRM vous recontactera pour confirmer les
            détails.
          </p>
          <a className="button primary" href="/catalogue">
            Parcourir le catalogue ↗
          </a>
          <h2>Coordonnées ENRM</h2>
          <p>
            Aucun numéro de téléphone, adresse e-mail, adresse physique, horaire ou contact WhatsApp
            n’est publié sur cette page. Le formulaire de conseil aide à préparer les informations
            sur votre véhicule, mais ne les transmet pas à ENRM.
          </p>
        </div>
      </section>
    </main>
  );
}
