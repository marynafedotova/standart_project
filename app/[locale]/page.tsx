import { HomeSectionsV2 } from "@/components/home-sections-v2";
import { StoreShell } from "@/components/storefront-db";
import { getFeaturedProducts, getHeroSettings, getProducts } from "@/lib/store";

export default async function LocalizedHomePage() {
  const products = await getProducts();
  const featuredProducts = await getFeaturedProducts();
  const heroSettings = await getHeroSettings();
  const seasons = [...new Set(products.map((product) => product.season).filter(Boolean))];

  return (
    <StoreShell>
      <HomeSectionsV2 featuredProducts={featuredProducts} seasons={seasons} heroSettings={heroSettings} />
    </StoreShell>
  );
}
