import { AdminAttributeClient } from "@/components/admin-attribute-client";
import { readDb } from "@/lib/json-db";

export default async function AdminWarehousesPage() {
  const db = await readDb();
  const warehouses = db.warehouses.map((item) => ({
    name: item.name,
    nameI18n: item.nameI18n,
    productCount: db.products.filter((product) =>
      product.warehouseStock.some((entry) => entry.warehouse === item.name && entry.quantity > 0)
    ).length
  }));

  return (
    <AdminAttributeClient
      title="Склади"
      heading="Керування складами"
      createLabel="Новий склад"
      endpoint="/api/warehouses"
      initialItems={warehouses}
    />
  );
}
