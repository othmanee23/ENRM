import { permanentRedirect, notFound } from 'next/navigation';
import { getProductById, productSlug } from '../../../lib/catalogue';

type SearchParams = Promise<{ id?: string }>;
export default async function LegacyProductRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;
  if (!id) notFound();
  const product = await getProductById(id);
  if (!product) notFound();
  permanentRedirect(`/produits/${productSlug(product)}`);
}
