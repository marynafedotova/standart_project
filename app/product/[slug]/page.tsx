import { notFound } from "next/navigation";
import { ProductDetails, StoreShell } from "@/components/storefront-db-v2";
import { getProductBySlug, getProductVariants } from "@/lib/store";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const variants = await getProductVariants(product);

  return (
    <StoreShell>
      <ProductDetails product={product} variants={variants} />
    </StoreShell>
  );
}
