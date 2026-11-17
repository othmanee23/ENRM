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
            ENRM Solutions &amp; Services met à disposition un catalogue de références d’huiles
            moteur destiné aux conducteurs et aux professionnels au Maroc.
          </p>
          <p>
            Parcourez les marques, gammes, viscosités et contenances recensées, puis transmettez
            votre sélection à ENRM pour confirmer les conditions de la demande.
          </p>
          <h2>Une référence, dans son détail.</h2>
          <p>
            Chaque formulation et chaque format correspondent à une référence distincte. Certaines
            photos ou références fabricant restent à compléter. Vérifiez toujours les normes et
            homologations à partir de la documentation du fabricant et des préconisations du
            constructeur de votre véhicule.
          </p>
          <a className="button primary" href="/catalogue">
            Découvrir les huiles ↗
          </a>
        </div>
      </section>
    </main>
  );
}
