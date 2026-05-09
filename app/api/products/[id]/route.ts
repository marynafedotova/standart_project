import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, stampNow, writeDb } from "@/lib/json-db";
import { parseMultiValue } from "@/lib/multi-value";
import { ensureUniqueSlug } from "@/lib/slug";
import { productSchema } from "@/lib/validators";

function normalizeWarehouseNames(entries: Array<{ warehouse: string; quantity: number }>) {
  return Array.from(new Set(entries.map((item) => item.warehouse.trim()).filter(Boolean)));
}

function calculateWarehouseStock(entries: Array<{ warehouse: string; quantity: number }>) {
  return entries.reduce((sum, item) => sum + Math.max(0, Math.trunc(item.quantity)), 0);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await readDb();
  const product = db.products.find((item) => item.id === id);

  if (!product) {
    return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = await readDb();
  const currentProduct = db.products.find((item) => item.id === id);
  const parsed = productSchema.safeParse({
    ...body,
    slug: ensureUniqueSlug(
      body.slug || body.name || currentProduct?.name || "product",
      db.products.map((item) => item.slug),
      currentProduct?.slug
    )
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные товара." }, { status: 400 });
  }

  const index = db.products.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
  }
  const product = {
    ...db.products[index],
    ...parsed.data,
    sku: db.products[index].sku,
    status: parsed.data.status,
    stock: calculateWarehouseStock(parsed.data.warehouseStock),
    oldPrice: parsed.data.oldPrice ?? null,
    badge: parsed.data.badge ?? null,
    updatedAt: stampNow()
  };
  for (const category of parseMultiValue(product.category)) {
    if (!db.categories.some((item) => item.name === category)) {
      db.categories.push({ name: category });
    }
  }
  if (product.brand && !db.brands.some((item) => item.name === product.brand)) {
    db.brands.push({ name: product.brand });
  }
  for (const season of parseMultiValue(product.season)) {
    if (!db.seasons.some((item) => item.name === season)) {
      db.seasons.push({ name: season });
    }
  }
  for (const warehouse of normalizeWarehouseNames(product.warehouseStock)) {
    if (!db.warehouses.some((item) => item.name === warehouse)) {
      db.warehouses.push({ name: warehouse });
    }
  }
  for (const color of product.colors) {
    if (!db.colors.some((item) => item.name === color)) {
      db.colors.push({ name: color });
    }
  }
  for (const size of product.sizes ?? []) {
    if (!db.sizes.some((item) => item.name === size)) {
      db.sizes.push({ name: size });
    }
  }
  for (const material of product.materials ?? []) {
    if (!db.materials.some((item) => item.name === material)) {
      db.materials.push({ name: material });
    }
  }
  db.products[index] = product;
  await writeDb(db);

  return NextResponse.json(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const { id } = await params;
  const db = await readDb();
  db.products = db.products.filter((item) => item.id !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
