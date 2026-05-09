import { AdminAttributeClient } from "@/components/admin-attribute-client";
import { readDb } from "@/lib/json-db";

export default async function AdminColorsPage() {
  const db = await readDb();
  const items = db.colors.map((item) => ({
    name: item.name,
    nameI18n: item.nameI18n,
    productCount: db.products.filter((product) => product.colors.includes(item.name)).length
  }));

  return (
    <AdminAttributeClient
      title="Кольори"
      heading="Керування кольорами товарів"
      createLabel="Новий колір"
      endpoint="/api/colors"
      initialItems={items}
    />
  );
}
