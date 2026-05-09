import { AdminAttributeClient } from "@/components/admin-attribute-client";
import { readDb } from "@/lib/json-db";

export default async function AdminMaterialsPage() {
  const db = await readDb();
  const items = db.materials.map((item) => ({
    name: item.name,
    nameI18n: item.nameI18n,
    productCount: db.products.filter((product) => product.materials.includes(item.name)).length
  }));

  return (
    <AdminAttributeClient
      title="Матеріали"
      heading="Керування матеріалами товарів"
      createLabel="Новий матеріал"
      endpoint="/api/materials"
      initialItems={items}
    />
  );
}
