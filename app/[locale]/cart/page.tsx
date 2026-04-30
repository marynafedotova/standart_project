import { CartClientView } from "@/components/storefront-actions-v2";
import { StoreShell } from "@/components/storefront-db";
import { getProducts } from "@/lib/store";

export default async function LocalizedCartPage() {
  const products = await getProducts();

  return (
    <StoreShell>
      <CartClientView products={products} />
    </StoreShell>
  );
}

