import { AdminEmployeesListClient } from "@/components/admin-employees-list-client";
import { requireAdmin } from "@/lib/auth";
import { getEmployees } from "@/lib/admin-workspace";

export default async function AdminEmployeesListPage() {
  await requireAdmin();
  const employees = await getEmployees();

  return <AdminEmployeesListClient employees={employees} />;
}
