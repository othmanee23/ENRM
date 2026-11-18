import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Conseil moteur',
  'Réunissez les informations du véhicule et vérifiez les préconisations constructeur avant de choisir une huile.',
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
                Marque, modèle, année et motorisation : réunissez ces informations avant de
                rechercher une référence dans le catalogue.
              </p>
              <p>
                La viscosité seule ne confirme pas une compatibilité. Les normes et homologations
                constructeur doivent aussi être vérifiées.
              </p>
              <a className="button primary" href="/catalogue">
                Explorer le catalogue <span>↗</span>
              </a>
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
