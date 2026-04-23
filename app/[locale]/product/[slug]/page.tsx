import { notFound } from "next/navigation";
import { ProductDetails, StoreShell } from "@/components/storefront-db-v2";
import { getProductBySlug } from "@/lib/store";

export default async function LocalizedProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <StoreShell>
      <ProductDetails product={product} />
    </StoreShell>
  );
}

