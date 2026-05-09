import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, writeDb, type Database, type DbNamedEntity, type DbProduct } from "@/lib/json-db";

type AttributeKey = "categories" | "brands" | "seasons" | "warehouses" | "colors" | "sizes" | "materials";

type RouteConfig = {
  key: AttributeKey;
  label: string;
  isUsed: (product: DbProduct, name: string) => boolean;
  replaceInProduct: (product: DbProduct, currentName: string, nextName: string) => DbProduct;
};

function normalizeName(value: string) {
  return value.trim();
}

function normalizeTranslations(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(([, item]) => typeof item === "string" && item.trim().length > 0);
  return entries.length > 0 ? Object.fromEntries(entries.map(([key, item]) => [key, item.trim()])) : undefined;
}

function upsertEntity(list: DbNamedEntity[], entity: DbNamedEntity) {
  const index = list.findIndex((item) => item.name === entity.name);
  if (index === -1) {
    list.push(entity);
    return;
  }

  list[index] = entity;
}

export function createAttributeRoute(config: RouteConfig) {
  return {
    async GET() {
      const db = await readDb();
      return NextResponse.json(db[config.key]);
    },

    async POST(request: Request) {
      const admin = await requireAdminApi();
      if (!admin) {
        return NextResponse.json({ error: "Потрібна авторизація." }, { status: 401 });
      }

      const body = (await request.json()) as { name?: string; nameI18n?: Record<string, string> };
      const name = normalizeName(body.name ?? "");
      if (name.length < 1) {
        return NextResponse.json({ error: `Назва для "${config.label}" закоротка.` }, { status: 400 });
      }

      const db = await readDb();
      if (db[config.key].some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return NextResponse.json({ error: `Такий запис "${config.label}" уже існує.` }, { status: 409 });
      }

      db[config.key].push({ name, nameI18n: normalizeTranslations(body.nameI18n) });
      await writeDb(db);
      return NextResponse.json({ ok: true, items: db[config.key] });
    },

    async PATCH(request: Request) {
      const admin = await requireAdminApi();
      if (!admin) {
        return NextResponse.json({ error: "Потрібна авторизація." }, { status: 401 });
      }

      const body = (await request.json()) as {
        currentName?: string;
        nextName?: string;
        nameI18n?: Record<string, string>;
      };
      const currentName = normalizeName(body.currentName ?? "");
      const nextName = normalizeName(body.nextName ?? "");

      if (!currentName || nextName.length < 1) {
        return NextResponse.json({ error: `Некоректні дані для "${config.label}".` }, { status: 400 });
      }

      const db = await readDb();
      const index = db[config.key].findIndex((item) => item.name === currentName);
      if (index === -1) {
        return NextResponse.json({ error: `Запис "${config.label}" не знайдено.` }, { status: 404 });
      }

      if (currentName !== nextName && db[config.key].some((item) => item.name.toLowerCase() === nextName.toLowerCase())) {
        return NextResponse.json({ error: `Такий запис "${config.label}" уже існує.` }, { status: 409 });
      }

      const currentItem = db[config.key][index];
      db[config.key][index] = {
        name: nextName,
        nameI18n: normalizeTranslations(body.nameI18n) ?? currentItem.nameI18n
      };
      db.products = db.products.map((product) => config.replaceInProduct(product, currentName, nextName));
      await writeDb(db);
      return NextResponse.json({ ok: true, items: db[config.key] });
    },

    async DELETE(request: Request) {
      const admin = await requireAdminApi();
      if (!admin) {
        return NextResponse.json({ error: "Потрібна авторизація." }, { status: 401 });
      }

      const body = (await request.json()) as { name?: string };
      const name = normalizeName(body.name ?? "");
      if (!name) {
        return NextResponse.json({ error: `Не вказано значення для "${config.label}".` }, { status: 400 });
      }

      const db = await readDb();
      const isUsed = db.products.some((product) => config.isUsed(product, name));
      if (isUsed) {
        return NextResponse.json({ error: `Не можна видалити "${config.label}", поки воно використовується в товарах.` }, { status: 400 });
      }

      db[config.key] = db[config.key].filter((item) => item.name !== name) as Database[AttributeKey];
      await writeDb(db);
      return NextResponse.json({ ok: true, items: db[config.key] });
    },

    upsertEntity
  };
}
