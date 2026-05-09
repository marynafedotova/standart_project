import { AdminAttributeClient } from "@/components/admin-attribute-client";
import { readDb } from "@/lib/json-db";

export default async function AdminSizesPage() {
  const db = await readDb();
  const items = db.sizes.map((item) => ({
    name: item.name,
    nameI18n: item.nameI18n,
    productCount: db.products.filter((product) => product.sizes.includes(item.name)).length
  }));

  return (
    <AdminAttributeClient
      title="Розміри"
      heading="Керування розмірами товарів"
      createLabel="Новий розмір"
      endpoint="/api/sizes"
      initialItems={items}
    />
  );
}
