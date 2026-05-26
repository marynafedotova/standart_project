import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { deleteEmployee, getEmployees, saveEmployee, type EmployeeRole } from "@/lib/admin-workspace";

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    email?: string;
    role?: EmployeeRole;
    department?: string;
    notes?: string;
    active?: boolean;
  };

  if (!body.name?.trim() || !body.email?.trim() || !body.role) {
    return NextResponse.json({ error: "Заповніть ім'я, email та роль." }, { status: 400 });
  }

  await saveEmployee({
    id: body.id,
    name: body.name,
    email: body.email,
    role: body.role,
    department: body.department ?? "",
    notes: body.notes ?? "",
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
