import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/json-db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.heroSettings);
}

export async function PATCH(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Потрібна авторизація." }, { status: 401 });
  }

  const body = await request.json();
  const db = await readDb();

  db.heroSettings = {
    badge: typeof body.badge === "string" ? body.badge.trim() : "",
    badgeI18n: normalizeTranslations(body.badgeI18n),
    title: typeof body.title === "string" ? body.title.trim() : "",
    titleI18n: normalizeTranslations(body.titleI18n),
    description: typeof body.description === "string" ? body.description.trim() : "",
    descriptionI18n: normalizeTranslations(body.descriptionI18n),
    primaryText: typeof body.primaryText === "string" ? body.primaryText.trim() : "",
    primaryTextI18n: normalizeTranslations(body.primaryTextI18n),
    primaryLink: typeof body.primaryLink === "string" && body.primaryLink.trim() ? body.primaryLink.trim() : "/catalog",
    secondaryText: typeof body.secondaryText === "string" ? body.secondaryText.trim() : "",
    secondaryTextI18n: normalizeTranslations(body.secondaryTextI18n),
    secondaryLink: typeof body.secondaryLink === "string" && body.secondaryLink.trim() ? body.secondaryLink.trim() : "/admin/products",
    imageSrc: typeof body.imageSrc === "string" ? body.imageSrc.trim() : "",
    imageAlt: typeof body.imageAlt === "string" ? body.imageAlt.trim() : "",
    imageAltI18n: normalizeTranslations(body.imageAltI18n),
    benefits: normalizeArray(body.benefits),
    benefitsI18n: normalizeBenefitsMap(body.benefitsI18n)
  };

  await writeDb(db);
  return NextResponse.json(db.heroSettings);
}

function normalizeTranslations(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const result = Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === "string" && item.trim().length > 0)
  );

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)))
    : [];
}

function normalizeBenefitsMap(value: unknown): Record<string, string[]> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const result = Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, normalizeArray(item)])
      .filter(([, item]) => item.length > 0)
  );

  return Object.keys(result).length > 0 ? result : undefined;
}
