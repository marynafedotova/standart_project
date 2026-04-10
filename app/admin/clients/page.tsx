import { LogoutButton } from "@/components/admin-forms";
import { AdminClientsClient } from "@/components/admin-clients-client";
import { requireAdmin } from "@/lib/auth";
import { getClientsForAdmin } from "@/lib/store";

export default async function AdminClientsPage() {
  await requireAdmin();
  const clients = await getClientsForAdmin();

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div />
        <LogoutButton />
      </div>
      <AdminClientsClient clients={clients} />
    </section>
  );
}
