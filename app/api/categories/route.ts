import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/json-db";
import { hasMultiValue, replaceMultiValue } from "@/lib/multi-value";

function normalizeCategoryName(value: string) {
  return value.trim();
}

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.categories);
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeCategoryName(body.name ?? "");

  if (name.length < 2) {
    return NextResponse.json({ error: "Название категории слишком короткое." }, { status: 400 });
  }

  const db = await readDb();
  if (db.categories.some((item) => item.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "Такая категория уже существует." }, { status: 409 });
  }

  db.categories.push(name);
  await writeDb(db);

  return NextResponse.json({ ok: true, categories: db.categories });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { currentName?: string; nextName?: string };
  const currentName = normalizeCategoryName(body.currentName ?? "");
  const nextName = normalizeCategoryName(body.nextName ?? "");

  if (!currentName || nextName.length < 2) {
    return NextResponse.json({ error: "Некорректные данные категории." }, { status: 400 });
  }

  const db = await readDb();
  const categoryIndex = db.categories.findIndex((item) => item === currentName);

  if (categoryIndex === -1) {
    return NextResponse.json({ error: "Категория не найдена." }, { status: 404 });
  }

  if (
    currentName !== nextName &&
    db.categories.some((item) => item.toLowerCase() === nextName.toLowerCase())
  ) {
    return NextResponse.json({ error: "Такая категория уже существует." }, { status: 409 });
  }

  db.categories[categoryIndex] = nextName;
  db.products = db.products.map((product) => ({
    ...product,
    category: replaceMultiValue(product.category, currentName, nextName)
  }));
  await writeDb(db);

  return NextResponse.json({ ok: true, categories: db.categories });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeCategoryName(body.name ?? "");

  if (!name) {
    return NextResponse.json({ error: "Категория не указана." }, { status: 400 });
  }

  const db = await readDb();
  const isUsed = db.products.some((product) => hasMultiValue(product.category, name));

  if (isUsed) {
    return NextResponse.json(
      { error: "Нельзя удалить категорию, пока она используется в товарах." },
      { status: 400 }
    );
  }

  db.categories = db.categories.filter((item) => item !== name);
  await writeDb(db);

  return NextResponse.json({ ok: true, categories: db.categories });
}
