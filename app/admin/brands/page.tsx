import { AdminAttributeClient } from "@/components/admin-attribute-client";
import { readDb } from "@/lib/json-db";

export default async function AdminBrandsPage() {
  const db = await readDb();
  const brands = db.brands.map((item) => ({
    name: item.name,
    nameI18n: item.nameI18n,
    productCount: db.products.filter((product) => product.brand === item.name).length
  }));

  return (
    <AdminAttributeClient
      title="Бренди"
      heading="Керування брендами товарів"
      createLabel="Новий бренд"
      endpoint="/api/brands"
      initialItems={brands}
    />
  );
}
