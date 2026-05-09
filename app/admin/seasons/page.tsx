import { AdminAttributeClient } from "@/components/admin-attribute-client";
import { readDb } from "@/lib/json-db";
import { hasMultiValue } from "@/lib/multi-value";

export default async function AdminSeasonsPage() {
  const db = await readDb();
  const seasons = db.seasons.map((item) => ({
    name: item.name,
    nameI18n: item.nameI18n,
    productCount: db.products.filter((product) => hasMultiValue(product.season, item.name)).length
  }));

  return (
    <AdminAttributeClient
      title="Сезони"
      heading="Керування сезонами товарів"
      createLabel="Новий сезон"
      endpoint="/api/seasons"
      initialItems={seasons}
    />
  );
}
