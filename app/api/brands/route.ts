import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/json-db";

function normalizeBrandName(value: string) {
  return value.trim();
}

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.brands);
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeBrandName(body.name ?? "");

  if (name.length < 2) {
    return NextResponse.json({ error: "Название бренда слишком короткое." }, { status: 400 });
  }

  const db = await readDb();
  if (db.brands.some((item) => item.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "Такой бренд уже существует." }, { status: 409 });
  }

  db.brands.push(name);
  await writeDb(db);

  return NextResponse.json({ ok: true, brands: db.brands });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { currentName?: string; nextName?: string };
  const currentName = normalizeBrandName(body.currentName ?? "");
  const nextName = normalizeBrandName(body.nextName ?? "");

  if (!currentName || nextName.length < 2) {
    return NextResponse.json({ error: "Некорректные данные бренда." }, { status: 400 });
  }

  const db = await readDb();
  const brandIndex = db.brands.findIndex((item) => item === currentName);

  if (brandIndex === -1) {
    return NextResponse.json({ error: "Бренд не найден." }, { status: 404 });
  }

  if (
    currentName !== nextName &&
    db.brands.some((item) => item.toLowerCase() === nextName.toLowerCase())
  ) {
    return NextResponse.json({ error: "Такой бренд уже существует." }, { status: 409 });
  }

  db.brands[brandIndex] = nextName;
  db.products = db.products.map((product) =>
    product.brand === currentName ? { ...product, brand: nextName } : product
  );
  await writeDb(db);

  return NextResponse.json({ ok: true, brands: db.brands });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeBrandName(body.name ?? "");

  if (!name) {
    return NextResponse.json({ error: "Бренд не указан." }, { status: 400 });
  }

  const db = await readDb();
  const isUsed = db.products.some((product) => product.brand === name);

  if (isUsed) {
    return NextResponse.json(
      { error: "Нельзя удалить бренд, пока он используется в товарах." },
      { status: 400 }
    );
  }

  db.brands = db.brands.filter((item) => item !== name);
  await writeDb(db);

  return NextResponse.json({ ok: true, brands: db.brands });
}
