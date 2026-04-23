import { AdminOrderCreate } from "@/components/admin-order-create";
import { requireAdmin } from "@/lib/auth";
import { getOrderById, getProducts } from "@/lib/store";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [order, products] = await Promise.all([getOrderById(id), getProducts()]);

  if (!order) {
    notFound();
  }

  return (
    <AdminOrderCreate
      initialOrder={order}
      products={products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price
      }))}
    />
  );
}
