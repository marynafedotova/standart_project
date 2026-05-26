import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { findEmployeeByLogin } from "@/lib/admin-workspace";
import { readDb } from "@/lib/json-db";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані для входу." }, { status: 400 });
  }

  const db = await readDb();
  const user =
    db.adminUsers.find((item) => item.email === parsed.data.email) ??
    (await findEmployeeByLogin(parsed.data.email));

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Невірний логін або пароль." }, { status: 401 });
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordValid) {
    return NextResponse.json({ error: "Невірний логін або пароль." }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    email: user.email
  });

  return NextResponse.json({ ok: true });
}
