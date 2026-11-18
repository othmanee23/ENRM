import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Contact',
  'Contactez ENRM pour une question sur nos huiles moteur, une référence ou une demande de commande.',
  '/contact',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">NOUS CONTACTER</p>
        <h1>Prenons le temps d’en parler.</h1>
        <div className="info-content">
          <h2>Comment pouvons-nous vous aider&nbsp;?</h2>
          <p>
            Une question sur une huile, une référence ou votre demande de commande&nbsp;? Écrivez à
            notre équipe via le formulaire de contact.
          </p>
          <a className="button primary" href="#site-contact">
            Accéder au formulaire ↗
          </a>
          <a className="contact-call-cta" href="tel:+212661428406">
            Appeler ENRM · +212 6 61 42 84 06
          </a>
          <a className="contact-email-cta" href="mailto:Nizarafifi1551@gmail.com">
            Écrire à Nizarafifi1551@gmail.com
          </a>
        </div>
      </section>
    </main>
  );
}
