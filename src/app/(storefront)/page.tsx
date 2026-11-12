import { LegacyPage } from '../../components/legacy/LegacyPage';
import { getPublicHomeProducts } from '../../lib/catalogue';
import { renderLegacyHome } from '../../lib/legacy-render';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await getPublicHomeProducts();
  const html = renderLegacyHome(products);
  const bootstrap = JSON.stringify({ products }).replace(/</g, '\\u003c');
  return (
    <>
      <LegacyPage name="home" html={html} />
      <script
        id="home-bootstrap"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: bootstrap }}
      />
    </>
  );
}
