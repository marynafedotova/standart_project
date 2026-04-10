import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdminApi } from "@/lib/auth";
import { readDb, stampNow, writeDb } from "@/lib/json-db";
import { parseMultiValue } from "@/lib/multi-value";
import { ensureUniqueSlug } from "@/lib/slug";
import { productSchema } from "@/lib/validators";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.products);
}

export async function POST(request: Request) {
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
    oldPrice: parsed.data.oldPrice ?? null,
    badge: parsed.data.badge ?? null,
    createdAt: now,
    updatedAt: now
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
  db.products.unshift(product);
  await writeDb(db);

  return NextResponse.json(product, { status: 201 });
}
