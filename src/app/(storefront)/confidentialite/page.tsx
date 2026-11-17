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
          <h2>Un panier conservé sur votre appareil.</h2>
          <p>
            Le panier utilise le stockage local de votre navigateur pour mémoriser les références
            sélectionnées et leurs quantités. Vous pouvez retirer chaque ligne ou effacer les
            données du site dans les réglages de votre navigateur.
          </p>
          <h2>Commandes enregistrées.</h2>
          <p>
            Lorsque vous envoyez une demande, ENRM reçoit votre nom, votre téléphone, votre ville,
            l’adresse souhaitée pour la livraison, les références choisies et leurs quantités. Le
            serveur recalcule le sous-total à partir du catalogue au moment de l’envoi; aucun
            paiement n’est effectué sur le site. Les données nécessaires au suivi sont enregistrées
            dans la base ENRM et accessibles aux administrateurs autorisés. Le responsable du
            traitement, la durée de conservation et les modalités d’exercice de vos droits doivent
            être précisés par ENRM.
          </p>
          <h2>Les autres formulaires.</h2>
          <p>
            Le formulaire de conseil reste dans votre navigateur et ne transmet pas les informations
            saisies.
          </p>
          <h2>Des médias locaux.</h2>
          <p>
            Les photographies, logos et vidéos du site sont servis depuis le projet. Aucun outil de
            publicité ni de mesure d’audience n’est intégré. Les informations légales du responsable
            du traitement et les modalités de conservation restent à compléter par ENRM.
          </p>
        </div>
      </section>
    </main>
  );
}
