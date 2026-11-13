import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Confidentialité',
  'Comment ENRM utilise les informations communiquées pour traiter une demande de commande.',
  '/confidentialite',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">CONFIDENTIALITÉ</p>
        <h1>
          Votre visite.
          <br /> Vos informations.
        </h1>
        <div className="info-content">
          <h2>Un panier conservé sur cet appareil.</h2>
          <p>
            Le panier de démonstration utilise le stockage local du navigateur pour mémoriser les
            identifiants de variantes et leurs quantités. Vous pouvez vider ce panier en retirant
            ses lignes ou effacer les données du site dans votre navigateur.
          </p>
          <h2>Commandes enregistrées.</h2>
          <p>
            Lorsque le catalogue est connecté à Supabase, une commande transmet à ENRM le nom, le
            téléphone, la ville, l’adresse de livraison, les références, quantités et prix des
            articles ainsi que le total calculé. Ces informations sont conservées dans la base de
            données pour permettre le traitement de la commande et sont accessibles aux comptes ENRM
            administrateurs. Les données de carte bancaire ne sont pas demandées et aucun paiement
            en ligne n’est effectué. Les coordonnées du responsable, la durée de conservation et les
            modalités de demande ou suppression doivent être précisées par ENRM avant l’ouverture
            commerciale.
          </p>
          <h2>Les autres formulaires.</h2>
          <p>Le formulaire de conseil reste une simulation locale et n’est pas transmis.</p>
          <h2>Des médias locaux.</h2>
          <p>
            Les photographies, logos et vidéos du site sont servis depuis le projet. Aucun outil de
            publicité ni de mesure d’audience n’est intégré. La politique de confidentialité du
            futur service commercial sera précisée avant son lancement.
          </p>
        </div>
      </section>
    </main>
  );
}
