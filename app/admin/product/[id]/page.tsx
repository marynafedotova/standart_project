import { AdminProductFormV5 } from "@/components/admin-product-form-v5";
import { requireAdmin } from "@/lib/auth";
import {
  getBrands,
  getCategories,
  getColors,
  getMaterials,
  getProductById,
  getProductGroups,
  getSeasons,
  getSizes,
  getWarehouses
} from "@/lib/store";

export default async function AdminProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const product = id === "new" ? null : await getProductById(id);
  const categories = await getCategories();
  const brands = await getBrands();
  const seasons = await getSeasons();
  const warehouses = await getWarehouses();
  const groups = await getProductGroups();
  const colors = await getColors();
  const sizes = await getSizes();
  const materials = await getMaterials();

  return (
    <AdminProductFormV5
      product={product}
      categories={categories}
      brands={brands}
      seasons={seasons}
      warehouses={warehouses}
      groups={groups}
      colors={colors}
      sizes={sizes}
      materials={materials}
    />
  );
}
