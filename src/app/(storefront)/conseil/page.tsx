import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Conseil moteur',
  'Préparez les informations sur votre véhicule pour demander conseil à ENRM.',
  '/conseil',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">LE CONSEIL ENRM</p>
        <h1>
          Votre moteur.
          <br /> Parlons-en.
        </h1>
        <div className="info-content">
          <div className="advice-intro">
            <div>
              <h2>Le bon choix commence avec les bons repères.</h2>
              <p>
                Marque, modèle, année et motorisation : réunissez les informations de votre véhicule
                avant de choisir votre huile.
              </p>
              <p>
                La viscosité seule ne confirme pas une compatibilité. Les normes et homologations
                constructeur doivent aussi être vérifiées.
              </p>
              <a className="button primary" href="/#conseil">
                Préparer ma demande <span>↗</span>
              </a>
              <p className="muted">Simulation locale. Aucun envoi à un conseiller ou à WhatsApp.</p>
            </div>
            <img
              src="/assets/media/oil-poster.jpg"
              alt="Un mécanicien verse de l’huile dans un moteur"
              loading="lazy"
              width={1920}
              height={1080}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
