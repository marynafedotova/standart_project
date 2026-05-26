import { AdminEmployeesStructureClient } from "@/components/admin-employees-structure-client";
import { requireAdmin } from "@/lib/auth";
import { getEmployees } from "@/lib/admin-workspace";

export default async function AdminEmployeesStructurePage() {
  await requireAdmin();
  const employees = await getEmployees();

  return <AdminEmployeesStructureClient initialEmployees={employees} />;
}
