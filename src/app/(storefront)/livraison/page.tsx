import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Livraison',
  'Les frais, délais et zones de livraison sont à confirmer avec ENRM avant validation d’une demande.',
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
            Les zones desservies, transporteurs, délais et frais ne sont pas publiés ici. ENRM doit
            les confirmer avant toute validation de commande.
          </p>
          <h2>Bidons et grands formats.</h2>
          <p>
            Les conditions pourront varier selon la destination, le poids et le conditionnement. Les
            fûts de 205 L et de 208 L restent deux formats distincts.
          </p>
          <h2>Avant toute confirmation.</h2>
          <p>
            L’envoi d’une demande ne déclenche aucun paiement. Le prix final, la disponibilité, les
            frais et le délai de livraison doivent être confirmés par ENRM; cette page n’annonce
            aucune livraison gratuite ni aucun délai garanti.
          </p>
          <a className="text-link" href="/contact">
            Consulter les informations de contact ↗
          </a>
        </div>
      </section>
    </main>
  );
}
