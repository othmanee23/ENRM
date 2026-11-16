import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Crédits médias',
  'Crédits et attributions des médias utilisés par ENRM.',
  '/credits',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">CRÉDITS &amp; SOURCES</p>
        <h1>
          Les images
          <br /> du mouvement.
        </h1>
        <div className="info-content">
          <h2>Médias fournis pour cette version.</h2>
          <p>
            Héros : vidéo fournie{' '}
            <code>golden-engine-oil-pouring-into-engine-close-up-2026-10-03-14-10-34-utc.mp4</code>.
            Gros plan du moteur : image fournie{' '}
            <code>adding-oil-to-engine-during-car-maintenance-2026-09-25-01-53-32-utc.jpg</code>.
            Ces scènes illustrent l’entretien et ne représentent pas un atelier ENRM.
          </p>
          <p>
            Photographie d’entretien : Daniel Andraski / Pexels, fichier fourni par l’utilisateur{' '}
            <code>pexels-daniel-andraski-197681005-13065690.jpg</code>. Vidéo d’huile dorée :
            fichier fourni{' '}
            <code>golden-oil-being-poured-into-a-car-engine-2026-10-02-17-18-55-utc.mov</code>,
            converti en MP4 avec son affiche pour le web. Ces scènes sont des illustrations et ne
            représentent pas un atelier ENRM.
          </p>
          <h2>Photographies des versions précédentes.</h2>
          <p>
            Route de montagne:{' '}
            <a href="https://unsplash.com/@nssaremi" target="_blank" rel="noopener noreferrer">
              nader saremi / Unsplash
            </a>{' '}
            (photo-1778432999466-1f0a0705d481). Détail de Porsche classique:{' '}
            <a href="https://unsplash.com/@iananderson" target="_blank" rel="noopener noreferrer">
              Ian Anderson / Unsplash
            </a>{' '}
            (photo-1609903730357-fc7951f05910).
          </p>
          <p>
            Utilisation selon la{' '}
            <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">
              licence Unsplash
            </a>
            . Les véhicules illustrent l’univers automobile et ne constituent pas une recommandation
            de lubrifiant ni une association commerciale avec ENRM.
          </p>
          <h2>Film de conduite.</h2>
          <p>
            <a
              href="https://www.pexels.com/video/car-on-road-11775720/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Daniel Narinian / Pexels — Car on Road, clip 11775720
            </a>
            . Plan de conduite sur route de montagne, adapté en boucle de 18 secondes pour le héros.
            Affiche extraite du même clip. Utilisation selon la licence Pexels.
          </p>
          <h2>Vidéo d’entretien.</h2>
          <p>
            <a
              href="https://www.pexels.com/video/pouring-engine-oil-into-car-engine-33930254/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Marc Alz / Pexels — clip 33930254
            </a>
            . Plan rapproché d’un mécanicien versant de l’huile, utilisé selon la{' '}
            <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">
              licence Pexels
            </a>
            . Affiche extraite de ce même clip. Ce plan d’illustration ne représente pas un atelier
            ENRM.
          </p>
          <h2>Marques et produits.</h2>
          <p>
            Les logos des marques proviennent de leurs sites officiels ; les photographies produit
            proviennent du dossier préparatoire fourni par ENRM. Ces marques restent la propriété de
            leurs titulaires. Leur présence sert à identifier les références et n’affirme aucun
            statut de distributeur agréé ou partenariat.
          </p>
          <h2>Typographie.</h2>
          <p>
            Inter Tight, distribuée par Google Fonts sous licence SIL Open Font License. Les
            fichiers de police et leur licence sont servis localement.
          </p>
        </div>
      </section>
    </main>
  );
}
