import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Livraison',
  'Tarifs et délais de livraison ENRM au Maroc, selon votre destination et la disponibilité des produits.',
  '/livraison',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">LIVRAISON AU MAROC</p>
        <h1>
          Vos produits.
          <br />
          Livrés selon vos besoins.
        </h1>
        <div className="info-content">
          <h2>Une livraison organisée depuis Rabat.</h2>
          <p>
            ENRM Solutions &amp; Services propose plusieurs options de livraison selon votre
            destination. Les tarifs et délais indiqués sont sous réserve de la disponibilité des
            produits et de la confirmation de votre commande.
          </p>
          <h2>Nos tarifs de livraison</h2>
          <h3>Rabat</h3>
          <p>Livraison gratuite, le jour même selon l’heure de confirmation et la disponibilité.</p>
          <h3>Casablanca et Kénitra</h3>
          <p>Livraison à 30 MAD, délai indicatif de 24 heures.</p>
          <h3>Autres destinations desservies au Maroc</h3>
          <p>Livraison à 40 MAD, délai indicatif de 24 à 48 heures.</p>
          <h2>Livraison gratuite dès 1 000 MAD.</h2>
          <p>
            Pour toute commande dont le montant des produits atteint 1 000 MAD, les frais de
            livraison standard sont offerts. Les éventuelles conditions particulières applicables
            aux grands conditionnements sont à confirmer avec ENRM.
          </p>
          <h2>Comment se déroule la livraison&nbsp;?</h2>
          <ol>
            <li>
              <strong>Vous sélectionnez vos produits.</strong> Parcourez le catalogue et ajoutez les
              références souhaitées à votre panier.
            </li>
            <li>
              <strong>Vous envoyez votre demande.</strong> Indiquez vos coordonnées, votre ville et
              votre adresse de livraison.
            </li>
            <li>
              <strong>ENRM confirme votre commande.</strong> Notre équipe confirme les produits,
              leur disponibilité, le montant final et les modalités de règlement.
            </li>
            <li>
              <strong>Votre commande est préparée.</strong> La livraison est organisée selon la
              destination et les conditions convenues.
            </li>
          </ol>
          <h2>Paiement</h2>
          <p>
            Le règlement s’effectue en espèces à la livraison selon les modalités convenues avec
            ENRM.
          </p>
          <p>
            Pour les commandes supérieures à 1 000 MAD, un acompte de 50 % est demandé avant
            l’expédition. Les modalités sont communiquées lors de la confirmation.
          </p>
          <h2>Une question sur votre livraison&nbsp;?</h2>
          <p>Notre équipe est disponible tous les jours de 9h à 22h.</p>
          <a className="text-link" href="/contact">
            Contacter ENRM ↗
          </a>
        </div>
      </section>
    </main>
  );
}
