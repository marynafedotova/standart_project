import { LogoutButton } from "@/components/admin-forms";
import { AdminProductsClient } from "@/components/admin-products-client";
import { requireAdmin } from "@/lib/auth";
import { getProducts } from "@/lib/store";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getProducts();

  return (
    <>
      <div className="adminPage">
        <div className="adminHeader">
          <div />
          <LogoutButton />
        </div>
      </div>
      <AdminProductsClient products={products} />
    </>
  );
}
