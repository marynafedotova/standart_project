import { AdminOrderCreate } from "@/components/admin-order-create";
import { requireAdmin } from "@/lib/auth";
import { getProducts } from "@/lib/store";

export default async function AdminOrderNewPage() {
  await requireAdmin();
  const products = await getProducts();

  return (
    <AdminOrderCreate
      products={products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price
      }))}
    />
  );
}
