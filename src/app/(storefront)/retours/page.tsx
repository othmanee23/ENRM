import { publicPageMetadata } from '../../../lib/seo';
export const metadata = publicPageMetadata(
  'Retours et conditions',
  'Consultez les informations ENRM sur les retours et conditions de vente.',
  '/retours',
);
export default function Page() {
  return (
    <main id="main">
      <section className="info-page section">
        <p className="eyebrow">RETOURS &amp; CONDITIONS</p>
        <h1>
          Un cadre clair.
          <br /> Avant de commander.
        </h1>
        <div className="info-content">
          <h2>Une demande, sans paiement en ligne.</h2>
          <p>
            Lorsque le site est connecté, vous pouvez envoyer une demande enregistrée par ENRM. Elle
            ne constitue pas une confirmation de vente : les prix, la disponibilité, la livraison et
            les conditions doivent être confirmés par l’équipe. Aucun paiement en ligne n’est
            proposé.
          </p>
          <h2>Retours et garanties.</h2>
          <p>
            Les modalités de retour, d’échange, de remboursement et de garantie ne sont pas
            précisées sur cette page. ENRM doit publier ses conditions commerciales et légales avant
            toute confirmation de vente.
          </p>
          <h2>À valider avant publication.</h2>
          <p>
            L’identité légale de l’entreprise, les conditions générales de vente et les modalités de
            paiement restent à compléter et à valider par ENRM.
          </p>
          <a className="text-link" href="/contact">
            Nous contacter ↗
          </a>
        </div>
      </section>
    </main>
  );
}
