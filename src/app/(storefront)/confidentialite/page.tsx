import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Confidentialité',
  'Informations sur les données personnelles transmises à ENRM depuis ce site.',
  '/confidentialite',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">PROTECTION DES DONNÉES</p>
        <h1>
          Vos informations.
          <br />
          Notre responsabilité.
        </h1>
        <div className="info-content">
          <h2>Qui traite vos informations&nbsp;?</h2>
          <p>
            ENRM Solutions &amp; Services utilise certaines données personnelles afin de répondre
            aux demandes des visiteurs et de gérer les commandes transmises depuis son site.
          </p>
          <p>
            <strong>Entreprise :</strong> ENRM Solutions &amp; Services
            <br />
            <strong>Adresse :</strong> Avenue de la Résistance, quartier de l’Océan, Rabat, Maroc
            <br />
            <strong>ICE :</strong> 003702111000048
            <br />
            <strong>Contact :</strong>{' '}
            <a href="mailto:Nizarafifi1551@gmail.com">Nizarafifi1551@gmail.com</a>
          </p>
          <h2>Les informations collectées</h2>
          <p>
            Selon les fonctionnalités utilisées, ENRM peut recevoir votre nom, adresse e-mail,
            numéro de téléphone, ville, adresse de livraison et les produits demandés.
          </p>
          <h2>Pourquoi ces informations sont-elles utilisées&nbsp;?</h2>
          <p>
            Les informations nécessaires aux commandes permettent de contacter les clients, vérifier
            les détails de leurs demandes et organiser leur traitement. Les informations envoyées au
            moyen du formulaire de contact servent à répondre aux messages.
          </p>
          <h2>Votre panier</h2>
          <p>
            Le site peut conserver les références sélectionnées dans le stockage local de votre
            navigateur afin de retrouver votre panier lors d’une prochaine visite.
          </p>
          <h2>Accès aux données</h2>
          <p>
            Les informations relatives aux commandes sont destinées aux personnes autorisées à
            assurer leur traitement chez ENRM.
          </p>
          <h2>Vos questions concernant vos données</h2>
          <p>
            Pour toute question concernant les données personnelles communiquées à ENRM, écrivez à{' '}
            <a href="mailto:Nizarafifi1551@gmail.com">Nizarafifi1551@gmail.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
