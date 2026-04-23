import { FavoritesClientView } from "@/components/storefront-actions-v2";
import { StoreShell } from "@/components/storefront-db-v2";
import { getProducts } from "@/lib/store";

export default async function LocalizedFavoritesPage() {
  const products = await getProducts();

  return (
    <StoreShell>
      <FavoritesClientView products={products} />
    </StoreShell>
  );
}
