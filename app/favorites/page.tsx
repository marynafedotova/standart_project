import { FavoritesClientView } from "@/components/storefront-actions-v2";
import { StoreShell } from "@/components/storefront-db";
import { getProducts } from "@/lib/store";

export default async function FavoritesPage() {
  const products = await getProducts();
  return (
    <StoreShell>
      <FavoritesClientView products={products} />
    </StoreShell>
  );
}
