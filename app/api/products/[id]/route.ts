import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, stampNow, writeDb } from "@/lib/json-db";
import { parseMultiValue } from "@/lib/multi-value";
import { ensureUniqueSlug } from "@/lib/slug";
import { productSchema } from "@/lib/validators";

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
    oldPrice: parsed.data.oldPrice ?? null,
    badge: parsed.data.badge ?? null,
    updatedAt: stampNow()
  };
  for (const category of parseMultiValue(product.category)) {
    if (!db.categories.includes(category)) {
      db.categories.push(category);
    }
  }
  if (product.brand && !db.brands.includes(product.brand)) {
    db.brands.push(product.brand);
  }
  for (const season of parseMultiValue(product.season)) {
    if (!db.seasons.includes(season)) {
      db.seasons.push(season);
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
