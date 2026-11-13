import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Livraison',
  'Informations de livraison ENRM au Maroc. Les conditions finales sont confirmées avec le client.',
  '/livraison',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">INFORMATIONS DE SERVICE</p>
        <h1>
          La livraison,
          <br /> en toute clarté.
        </h1>
        <div className="info-content">
          <h2>Conditions en cours de définition.</h2>
          <p>
            Les zones desservies, transporteurs, délais et frais de livraison seront précisés par
            ENRM avant toute ouverture commerciale.
          </p>
          <h2>Bidons et grands formats.</h2>
          <p>
            Les conditions pourront varier selon la destination, le poids et le conditionnement. Les
            fûts de 205 L et de 208 L restent deux formats distincts.
          </p>
          <h2>Dans cette démonstration.</h2>
          <p>
            Le panier affiche un sous-total indicatif. Les frais inconnus ne sont pas traités comme
            une livraison gratuite. Une demande connectée est enregistrée sans paiement; aucun
            montant final ni délai garanti n’est annoncé.
          </p>
          <a className="text-link" href="/contact">
            Consulter les informations de contact ↗
          </a>
        </div>
      </section>
    </main>
  );
}
