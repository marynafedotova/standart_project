import { HomeSectionsV2 } from "@/components/home-sections-v2";
import { StoreShell } from "@/components/storefront-db-v2";
import { getFeaturedProducts, getProducts } from "@/lib/store";

export default async function HomePage() {
  const products = await getProducts();
  const featuredProducts = await getFeaturedProducts();
  const seasons = [...new Set(products.map((product) => product.season).filter(Boolean))];

  return (
    <StoreShell>
      <HomeSectionsV2 featuredProducts={featuredProducts} seasons={seasons} />
    </StoreShell>
  );
}
