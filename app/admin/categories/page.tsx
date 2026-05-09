import { AdminAttributeClient } from "@/components/admin-attribute-client";
import { readDb } from "@/lib/json-db";
import { hasMultiValue } from "@/lib/multi-value";

export default async function AdminCategoriesPage() {
  const db = await readDb();
  const categories = db.categories.map((item) => ({
    name: item.name,
    nameI18n: item.nameI18n,
    productCount: db.products.filter((product) => hasMultiValue(product.category, item.name)).length
  }));

  return (
    <AdminAttributeClient
      title="Категорії"
      heading="Керування категоріями товарів"
      createLabel="Нова категорія"
      endpoint="/api/categories"
      initialItems={categories}
    />
  );
}
