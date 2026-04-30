import { AdminWarehousesClient } from "@/components/admin-warehouses-client";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/json-db";

export default async function AdminWarehousesPage() {
  await requireAdmin();
  const db = await readDb();
  const warehouses = db.warehouses.map((name) => ({
    name,
    productCount: db.products.filter((product) => product.warehouseStock.some((entry) => entry.warehouse === name && entry.quantity > 0)).length,
    units: db.products.reduce(
      (sum, product) =>
        sum +
        product.warehouseStock
          .filter((entry) => entry.warehouse === name)
          .reduce((warehouseSum, entry) => warehouseSum + entry.quantity, 0),
      0
    )
  }));

  return <AdminWarehousesClient initialWarehouses={warehouses} />;
}
