import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
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

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.products);
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
    }

    const body = await request.json();
    const db = await readDb();
    const parsed = productSchema.safeParse({
      ...body,
      slug: ensureUniqueSlug(body.slug || body.name || "product", db.products.map((item) => item.slug))
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные товара." }, { status: 400 });
    }

    const now = stampNow();
    const product = {
      id: randomUUID(),
      sku: "",
      ...parsed.data,
      status: parsed.data.status,
      stock: calculateWarehouseStock(parsed.data.warehouseStock),
      oldPrice: parsed.data.oldPrice ?? null,
      badge: parsed.data.badge ?? null,
      createdAt: now,
      updatedAt: now
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

    db.products.unshift(product);
    await writeDb(db);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products failed", error);
    return NextResponse.json({ error: "Не удалось сохранить товар." }, { status: 500 });
  }
}
