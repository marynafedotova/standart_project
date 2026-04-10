import { AdminBrandsClient } from "@/components/admin-brands-client";
import { readDb } from "@/lib/json-db";

export default async function AdminBrandsPage() {
  const db = await readDb();
  const brands = db.brands.map((name) => ({
    name,
    productCount: db.products.filter((product) => product.brand === name).length
  }));

  return <AdminBrandsClient initialBrands={brands} />;
}
