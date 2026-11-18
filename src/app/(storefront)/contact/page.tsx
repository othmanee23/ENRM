import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Contact',
  'Contactez ENRM pour une référence, une disponibilité ou une commande d’huile moteur.',
  '/contact',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">NOUS CONTACTER</p>
        <h1>Parlons de votre besoin.</h1>
        <div className="info-content">
          <h2>Une question&nbsp;? Notre équipe est à votre écoute.</h2>
          <p>
            Vous recherchez une référence précise, souhaitez connaître une disponibilité ou obtenir
            des informations sur une commande&nbsp;? Contactez ENRM Solutions &amp; Services. Nous
            accompagnons les particuliers et les professionnels dans leurs besoins en huiles moteur
            et lubrifiants automobiles.
          </p>
          <h2>Nos coordonnées</h2>
          <p>
            <strong>ENRM Solutions &amp; Services</strong>
            <br />
            Avenue de la Résistance, quartier de l’Océan, Rabat, Maroc
          </p>
          <p>
            <strong>Téléphone et WhatsApp</strong>
            <br />
            <a href="tel:+212661428406">+212 6 61 42 84 06 · Appeler</a>
            <br />
            <a href="https://wa.me/212661428406">Écrire sur WhatsApp ↗</a>
          </p>
          <p>
            <strong>E-mail</strong>
            <br />
            <a href="mailto:Nizarafifi1551@gmail.com">Nizarafifi1551@gmail.com</a>
          </p>
          <p>
            <strong>Horaires de contact</strong>
            <br />
            Tous les jours, de 9h à 22h.
          </p>
          <h2>Nous écrire</h2>
          <p>
            Précisez votre besoin et les références recherchées. Notre équipe pourra vous répondre
            en utilisant les coordonnées fournies.
          </p>
          <a className="button primary" href="#site-contact">
            Accéder au formulaire ↗
          </a>
        </div>
      </section>
    </main>
  );
}
