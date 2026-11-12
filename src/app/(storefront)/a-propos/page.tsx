import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'À propos d’ENRM',
  'Découvrez ENRM, Solutions & Services.',
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
          <h2>Le choix mérite de la clarté.</h2>
          <p>
            ENRM Solutions &amp; Services prépare un espace consacré aux huiles moteur pour les
            conducteurs et les professionnels au Maroc.
          </p>
          <p>
            L’objectif de cette démonstration : explorer les grandes marques, comparer des
            références précises et choisir une contenance sans perdre de vue les besoins de son
            moteur.
          </p>
          <h2>Une référence, dans son détail.</h2>
          <p>
            Chaque formulation et chaque format restent distincts. Les photos disponibles sont
            associées au bon conditionnement. Les informations techniques doivent être confirmées à
            partir de la documentation fabricant.
          </p>
          <a className="button primary" href="/catalogue">
            Découvrir les huiles ↗
          </a>
        </div>
      </section>
    </main>
  );
}
