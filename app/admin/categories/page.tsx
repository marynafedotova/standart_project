import { AdminCategoriesClient } from "@/components/admin-categories-client";
import { readDb } from "@/lib/json-db";
import { hasMultiValue } from "@/lib/multi-value";

export default async function AdminCategoriesPage() {
  const db = await readDb();
  const categories = db.categories.map((name) => ({
    name,
    productCount: db.products.filter((product) => hasMultiValue(product.category, name)).length
  }));

  return <AdminCategoriesClient initialCategories={categories} />;
}
