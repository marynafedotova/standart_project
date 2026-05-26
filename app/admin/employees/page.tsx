import { AdminEmployeesClient } from "@/components/admin-employees-client";
import { requireAdmin } from "@/lib/auth";
import { getEmployees } from "@/lib/admin-workspace";

export default async function AdminEmployeesPage() {
  await requireAdmin();
  const employees = await getEmployees();

  return <AdminEmployeesClient initialEmployees={employees} />;
}
