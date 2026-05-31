import { AdminEmployeesClient } from "@/components/admin-employees-client";
import { requireAdmin } from "@/lib/auth";
import { getEmployees } from "@/lib/admin-workspace";

export default async function AdminEmployeesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin();
  const { edit } = await searchParams;
  const employees = await getEmployees();

  return <AdminEmployeesClient initialEmployees={employees} editEmployeeId={edit} />;
}
