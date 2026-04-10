import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/json-db";
import { hasMultiValue, replaceMultiValue } from "@/lib/multi-value";

function normalizeSeasonName(value: string) {
  return value.trim();
}

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.seasons);
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeSeasonName(body.name ?? "");

  if (name.length < 2) {
    return NextResponse.json({ error: "Название сезона слишком короткое." }, { status: 400 });
  }

  const db = await readDb();
  if (db.seasons.some((item) => item.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "Такой сезон уже существует." }, { status: 409 });
  }

  db.seasons.push(name);
  await writeDb(db);

  return NextResponse.json({ ok: true, seasons: db.seasons });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { currentName?: string; nextName?: string };
  const currentName = normalizeSeasonName(body.currentName ?? "");
  const nextName = normalizeSeasonName(body.nextName ?? "");

  if (!currentName || nextName.length < 2) {
    return NextResponse.json({ error: "Некорректные данные сезона." }, { status: 400 });
  }

  const db = await readDb();
  const seasonIndex = db.seasons.findIndex((item) => item === currentName);

  if (seasonIndex === -1) {
    return NextResponse.json({ error: "Сезон не найден." }, { status: 404 });
  }

  if (currentName !== nextName && db.seasons.some((item) => item.toLowerCase() === nextName.toLowerCase())) {
    return NextResponse.json({ error: "Такой сезон уже существует." }, { status: 409 });
  }

  db.seasons[seasonIndex] = nextName;
  db.products = db.products.map((product) => ({
    ...product,
    season: replaceMultiValue(product.season, currentName, nextName)
  }));
  await writeDb(db);

  return NextResponse.json({ ok: true, seasons: db.seasons });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = normalizeSeasonName(body.name ?? "");

  if (!name) {
    return NextResponse.json({ error: "Сезон не указан." }, { status: 400 });
  }

  const db = await readDb();
  const isUsed = db.products.some((product) => hasMultiValue(product.season, name));

  if (isUsed) {
    return NextResponse.json({ error: "Нельзя удалить сезон, пока он используется в товарах." }, { status: 400 });
  }

  db.seasons = db.seasons.filter((item) => item !== name);
  await writeDb(db);

  return NextResponse.json({ ok: true, seasons: db.seasons });
}
