import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Conseil moteur',
  'Les repères utiles pour rechercher une huile moteur adaptée à votre véhicule.',
  '/conseil',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">LE CONSEIL ENRM</p>
        <h1>
          Votre moteur.
          <br />
          Notre attention.
        </h1>
        <div className="info-content">
          <div className="advice-intro">
            <div>
              <h2>Bien choisir commence par bien connaître son véhicule.</h2>
              <p>
                Chaque moteur possède ses propres exigences en matière de lubrification. Pour
                rechercher une huile adaptée, il est important de connaître la marque, le modèle,
                l’année, la motorisation et les préconisations du constructeur.
              </p>
              <p>
                La viscosité seule ne permet pas de garantir la compatibilité d’une huile avec un
                moteur.
              </p>
              <h2>Besoin d’aide pour trouver votre huile&nbsp;?</h2>
              <p>
                Communiquez-nous les informations de votre véhicule et la référence recherchée, si
                vous la connaissez. Notre équipe pourra vous orienter et vous aider à identifier les
                caractéristiques techniques à vérifier.
              </p>
              <h3>Informations utiles avant de nous contacter</h3>
              <ul>
                <li>Marque et modèle du véhicule</li>
                <li>Année de mise en circulation</li>
                <li>Carburant et motorisation</li>
                <li>Normes ou homologations du manuel d’entretien, si disponibles</li>
              </ul>
              <a className="button primary" href="/contact">
                Contacter un conseiller <span>↗</span>
              </a>
              <a className="text-link" href="/catalogue">
                Explorer le catalogue ↗
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
