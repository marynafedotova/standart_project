import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { deleteEmployee, getEmployees, saveEmployee } from "@/lib/admin-workspace";
import type { EmployeeRole } from "@/lib/admin-workspace-shared";

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    login?: string;
    password?: string;
    role?: EmployeeRole;
    department?: string;
    notes?: string;
    permissions?: import("@/lib/admin-workspace-shared").AdminSectionPermission[];
    isManager?: boolean;
    managerId?: string;
    active?: boolean;
  };

  if (!body.firstName?.trim() || !body.lastName?.trim() || !body.email?.trim() || !body.login?.trim() || !body.role) {
    return NextResponse.json({ error: "Заповніть ім'я, прізвище, email, логін та роль." }, { status: 400 });
  }

  if (!body.id && !body.password?.trim()) {
    return NextResponse.json({ error: "Для нового співробітника потрібно задати пароль." }, { status: 400 });
  }

  await saveEmployee({
    id: body.id,
    firstName: body.firstName,
    lastName: body.lastName,
    position: body.position ?? "",
    birthDate: body.birthDate ?? "",
    phone: body.phone ?? "",
    email: body.email,
    login: body.login,
    password: body.password?.trim() ?? "",
    role: body.role,
    department: body.department ?? "",
    notes: body.notes ?? "",
    permissions: body.permissions ?? [],
    isManager: body.isManager ?? false,
    managerId: body.managerId ?? "",
    active: body.active ?? true
  });

  return NextResponse.json({ employees: await getEmployees() });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing employee id." }, { status: 400 });
  }

  await deleteEmployee(id);
  return NextResponse.json({ employees: await getEmployees() });
}
