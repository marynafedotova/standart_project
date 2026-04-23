import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/auth";
import { readDb, stampNow, writeDb } from "@/lib/json-db";
import { parseMultiValue } from "@/lib/multi-value";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-defaults";
import { ensureUniqueSlug } from "@/lib/slug";
import { productSchema } from "@/lib/validators";

type ProductImportRow = Record<string, string | number | boolean | null | undefined>;

function parseText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseNumber(value: unknown) {
  const text = parseText(value).replace(",", ".");
  if (!text) return 0;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNullableNumber(value: unknown) {
  const text = parseText(value).replace(",", ".");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntValue(value: unknown) {
  return Math.max(0, Math.trunc(parseNumber(value)));
}

function parseLines(value: unknown) {
  return parseText(value)
    .split(/\r?\n|\|/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
}

function parseTranslationMap(primaryKey: string, row: ProductImportRow) {
  const ru = parseText(row[`${primaryKey}_ru`]);
  const en = parseText(row[`${primaryKey}_en`]);
  return {
    ru,
    en
  };
}

function buildTemplateResponse() {
  const workbook = XLSX.utils.book_new();
  const rows = [
    {
      name: "Base product title",
      slug: "bazova-nazva-tovaru",
      status: "Активен",
      category: "Clothes | New arrivals",
      brand: "Nova",
      size: "S | M | L",
      centimeters: "95",
      ageGroup: "18+",
      audience: "Women",
      season: "Spring | Summer",
      price: 2499.99,
      oldPrice: 2999.99,
      stock: 12,
      material: "Cotton",
      colors: "White | Emerald",
      badge: "New",
      description: "Short base language description",
      image: "/images/product-placeholder.svg",
      gallery: "/images/product-placeholder.svg | https://example.com/product-2.jpg",
      features: "Light fabric | Comfortable fit",
      name_ru: "Bazovoe nazvanie tovara",
      name_en: "Base product title",
      description_ru: "Kratkoe opisanie tovara na russkom",
      description_en: "Short product description in English"
    }
  ];

  const helpRows = [
    { field: "name", required: "yes", description: "Base product title" },
    { field: "slug", required: "no", description: "Unique URL slug. If it matches existing slug, product will update" },
    { field: "status", required: "no", description: "Активен / Черновик / Нет в наличии / Брак" },
    { field: "category", required: "yes", description: "Multiple values separated by |" },
    { field: "brand", required: "no", description: "Brand name" },
    { field: "size", required: "no", description: "Size or size list" },
    { field: "centimeters", required: "no", description: "Dimensions in centimeters" },
    { field: "ageGroup", required: "no", description: "Age group" },
    { field: "audience", required: "no", description: "Target audience" },
    { field: "season", required: "no", description: "Multiple seasons separated by |" },
    { field: "price", required: "yes", description: "Current price, decimals allowed" },
    { field: "oldPrice", required: "no", description: "Old price, optional" },
    { field: "stock", required: "yes", description: "Stock quantity" },
    { field: "material", required: "no", description: "Material" },
    { field: "colors", required: "no", description: "Multiple colors separated by |" },
    { field: "badge", required: "no", description: "Card badge" },
    { field: "description", required: "no", description: "Base description" },
    { field: "image", required: "no", description: "Primary image" },
    { field: "gallery", required: "no", description: "Gallery images separated by |" },
    { field: "features", required: "no", description: "Features separated by |" },
    { field: "name_ru / name_en", required: "no", description: "Translated titles" },
    { field: "description_ru / description_en", required: "no", description: "Translated descriptions" }
  ];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Products template");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(helpRows), "Fields");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="products-import-template.xlsx"'
    }
  });
}

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Authorization required." }, { status: 401 });
  }

  return buildTemplateResponse();
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Authorization required." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File not found." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return NextResponse.json({ error: "Workbook does not contain sheets." }, { status: 400 });
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ProductImportRow>(sheet, { defval: "" });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Workbook does not contain product rows." }, { status: 400 });
  }

  const db = await readDb();
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const baseSlug = parseText(row.slug) || parseText(row.name) || "product";
    const existingProduct =
      (parseText(row.slug) ? db.products.find((item) => item.slug === parseText(row.slug)) : null) ?? null;
    const slug = ensureUniqueSlug(
      baseSlug,
      db.products.map((item) => item.slug),
      existingProduct?.slug
    );

    const parsed = productSchema.safeParse({
      name: parseText(row.name),
      slug,
      status: parseText(row.status) || "Активен",
      category: parseText(row.category),
      brand: parseText(row.brand),
      size: parseText(row.size),
      centimeters: parseText(row.centimeters),
      ageGroup: parseText(row.ageGroup),
      audience: parseText(row.audience),
      season: parseText(row.season),
      price: parseNumber(row.price),
      oldPrice: parseNullableNumber(row.oldPrice),
      stock: parseIntValue(row.stock),
      material: parseText(row.material),
      colors: parseLines(row.colors),
      badge: parseText(row.badge) || null,
      description: parseText(row.description),
      image: parseText(row.image) || DEFAULT_PRODUCT_IMAGE,
      images: parseLines(row.gallery),
      features: parseLines(row.features),
      nameI18n: parseTranslationMap("name", row),
      descriptionI18n: parseTranslationMap("description", row)
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      const details = Object.entries(flattened)
        .filter(([, value]) => value && value.length > 0)
        .map(([key, value]) => `${key}: ${value?.join(", ")}`)
        .join("; ");
      errors.push(`Row ${rowNumber}: ${details || "invalid data"}`);
      continue;
    }

    const now = stampNow();
    const nextProduct = {
      ...(existingProduct ?? {
        id: randomUUID(),
        sku: "",
        createdAt: now
      }),
      ...parsed.data,
      slug,
      oldPrice: parsed.data.oldPrice ?? null,
      badge: parsed.data.badge ?? null,
      updatedAt: now
    };

    if (existingProduct) {
      const existingIndex = db.products.findIndex((item) => item.id === existingProduct.id);
      db.products[existingIndex] = nextProduct;
      updated += 1;
    } else {
      db.products.unshift(nextProduct);
      created += 1;
    }

    for (const category of parseMultiValue(nextProduct.category)) {
      if (!db.categories.includes(category)) {
        db.categories.push(category);
      }
    }
    if (nextProduct.brand && !db.brands.includes(nextProduct.brand)) {
      db.brands.push(nextProduct.brand);
    }
    for (const season of parseMultiValue(nextProduct.season)) {
      if (!db.seasons.includes(season)) {
        db.seasons.push(season);
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "Some rows did not pass validation.",
        errorCode: "IMPORT_VALIDATION_FAILED",
        created,
        updated,
        errors
      },
      { status: 400 }
    );
  }

  await writeDb(db);

  return NextResponse.json({
    ok: true,
    created,
    updated,
    total: rows.length
  });
}
