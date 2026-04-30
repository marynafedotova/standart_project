import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/json-db";

function normalizeWarehouseName(value: string) {
  return value.trim();
}

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.warehouses);
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeWarehouseName(body.name ?? "");

  if (name.length < 2) {
    return NextResponse.json({ error: "Название склада слишком короткое." }, { status: 400 });
  }

  const db = await readDb();
  if (db.warehouses.some((item) => item.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "Такой склад уже существует." }, { status: 409 });
  }

  db.warehouses.push(name);
  await writeDb(db);

  return NextResponse.json({ ok: true, warehouses: db.warehouses });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { currentName?: string; nextName?: string };
  const currentName = normalizeWarehouseName(body.currentName ?? "");
  const nextName = normalizeWarehouseName(body.nextName ?? "");

  if (!currentName || nextName.length < 2) {
    return NextResponse.json({ error: "Некорректные данные склада." }, { status: 400 });
  }

  const db = await readDb();
  const warehouseIndex = db.warehouses.findIndex((item) => item === currentName);

  if (warehouseIndex === -1) {
    return NextResponse.json({ error: "Склад не найден." }, { status: 404 });
  }

  if (currentName !== nextName && db.warehouses.some((item) => item.toLowerCase() === nextName.toLowerCase())) {
    return NextResponse.json({ error: "Такой склад уже существует." }, { status: 409 });
  }

  db.warehouses[warehouseIndex] = nextName;
  db.products = db.products.map((product) => ({
    ...product,
    warehouseStock: product.warehouseStock.map((entry) =>
      entry.warehouse === currentName ? { ...entry, warehouse: nextName } : entry
    )
  }));
  await writeDb(db);

  return NextResponse.json({ ok: true, warehouses: db.warehouses });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeWarehouseName(body.name ?? "");

  if (!name) {
    return NextResponse.json({ error: "Склад не указан." }, { status: 400 });
  }

  const db = await readDb();
  const isUsed = db.products.some((product) =>
    product.warehouseStock.some((entry) => entry.warehouse === name && entry.quantity > 0)
  );

  if (isUsed) {
    return NextResponse.json({ error: "Нельзя удалить склад, пока на нем есть товар." }, { status: 400 });
  }

  db.warehouses = db.warehouses.filter((item) => item !== name);
  await writeDb(db);

  return NextResponse.json({ ok: true, warehouses: db.warehouses });
}
