import { CatalogFiltersV4 } from "@/components/catalog-filters-v4";
import { StoreShell } from "@/components/storefront-db";
import { getProducts } from "@/lib/store";

export default async function CatalogPage({
  searchParams
}: {
  searchParams?: Promise<{ season?: string | string[] }>;
}) {
  const products = await getProducts();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSeason = Array.isArray(resolvedSearchParams?.season)
    ? resolvedSearchParams?.season[0] ?? ""
    : resolvedSearchParams?.season ?? "";

  return (
    <StoreShell>
      <CatalogFiltersV4 products={products} initialSeason={initialSeason} />
    </StoreShell>
  );
}
