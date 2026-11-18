import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'À propos d’ENRM',
  'ENRM Solutions & Services, spécialiste des huiles moteur et lubrifiants automobiles au Maroc.',
  '/a-propos',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">À PROPOS D’ENRM</p>
        <h1>Le mouvement commence ici.</h1>
        <div className="info-content">
          <div className="info-image">
            <img
              src="/assets/media/workshop.jpg"
              alt="Entretien d’un moteur en atelier"
              loading="lazy"
              width={1200}
              height={800}
            />
          </div>
          <h2>Votre partenaire en lubrifiants automobiles.</h2>
          <p>
            ENRM Solutions &amp; Services est une entreprise basée à Rabat, spécialisée dans la
            vente, la distribution et la livraison d’huiles moteur et de lubrifiants automobiles au
            Maroc.
          </p>
          <p>
            Nous accompagnons les particuliers et les professionnels avec un catalogue de références
            de différentes marques et des solutions adaptées aux quantités recherchées.
          </p>
          <h2>Le bon produit commence par la bonne information.</h2>
          <p>
            Choisir une huile moteur ne se résume pas à sélectionner une marque ou une viscosité.
            Chaque formulation répond à des caractéristiques précises. Les normes, les homologations
            constructeur et les recommandations techniques aident à identifier une référence
            appropriée. Nous accordons une importance particulière à la clarté des informations et à
            l’accompagnement de nos clients.
          </p>
          <h2>Des solutions pour les particuliers et les professionnels.</h2>
          <p>
            Que vous recherchiez un bidon pour l’entretien de votre véhicule ou des quantités
            destinées à votre activité professionnelle, ENRM vous accompagne. Notre catalogue
            s’adresse aux automobilistes, aux ateliers et aux professionnels de l’entretien
            automobile.
          </p>
          <h2>Un service proche de vos besoins.</h2>
          <p>
            Basée à Rabat, notre équipe assure un service de proximité et propose des solutions de
            livraison vers différentes villes du Maroc, avec des conditions commerciales clairement
            communiquées.
          </p>
          <a className="button primary" href="/catalogue">
            Découvrir nos huiles moteur ↗
          </a>
        </div>
      </section>
    </main>
  );
}
