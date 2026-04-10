import { AdminSeasonsClient } from "@/components/admin-seasons-client";
import { readDb } from "@/lib/json-db";
import { hasMultiValue } from "@/lib/multi-value";

export default async function AdminSeasonsPage() {
  const db = await readDb();
  const seasons = db.seasons.map((name) => ({
    name,
    productCount: db.products.filter((product) => hasMultiValue(product.season, name)).length
  }));

  return <AdminSeasonsClient initialSeasons={seasons} />;
}
