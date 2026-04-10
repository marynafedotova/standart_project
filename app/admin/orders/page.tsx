import { LogoutButton } from "@/components/admin-forms";
import { AdminOrdersClientV4 } from "@/components/admin-orders-client-v4";
import { requireAdmin } from "@/lib/auth";
import { getOrdersForAdmin } from "@/lib/store";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getOrdersForAdmin();

  return (
    <>
      <div className="adminPage">
        <div className="adminHeader">
          <div />
          <LogoutButton />
        </div>
      </div>
      <AdminOrdersClientV4 initialOrders={orders} />
    </>
  );
}
