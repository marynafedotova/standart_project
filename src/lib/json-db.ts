import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { parseMultiValue } from "@/lib/multi-value";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-defaults";
import { prisma } from "@/lib/prisma";

const DEFAULT_WAREHOUSE_NAME = "Основной склад";

export type DbWarehouseStock = {
  warehouse: string;
  quantity: number;
};

export type DbNamedEntity = {
  name: string;
  nameI18n?: Record<string, string>;
};

export type DbProduct = {
  id: string;
  sku: string;
  code: string;
  group: string;
  variantColor: string;
  slug: string;
  name: string;
  nameI18n?: Record<string, string>;
  status: string;
  category: string;
  brand: string;
  size: string;
  centimeters: string;
  ageGroup: string;
  audience: string;
  season: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  material: string;
  colors: string[];
  materials: string[];
  sizes: string[];
  badge: string | null;
  description: string;
  descriptionI18n?: Record<string, string>;
  warehouseStock: DbWarehouseStock[];
  image: string;
  images: string[];
  features: string[];
  createdAt: string;
  updatedAt: string;
};

export type DbPostBlock = {
  id: string;
  type: "paragraph" | "heading" | "image" | "list" | "quote" | "richText";
  text?: string;
  items?: string[];
  src?: string;
  alt?: string;
  href?: string;
  html?: string;
  level?: 2 | 3;
  align?: "left" | "center" | "wide";
};

export type DbPost = {
  id: string;
  slug: string;
  title: string;
  titleI18n?: Record<string, string>;
  category: string;
  excerpt: string;
  excerptI18n?: Record<string, string>;
  cover: string;
  content: string[];
  contentBlocks?: DbPostBlock[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DbAdminUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type DbOrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type DbOrder = {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  email: string;
  comment: string;
  managerComment: string;
  deliveryMethod: string;
  paymentMethod: string;
  region: string;
  city: string;
  novaPoshtaType: string;
  novaPoshtaBranch: string;
  courierAddress: string;
  status: string;
  total: number;
  items: DbOrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type DbClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  orderIds: string[];
  orderNumbers: number[];
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  adminUsers: DbAdminUser[];
  categories: DbNamedEntity[];
  brands: DbNamedEntity[];
  seasons: DbNamedEntity[];
  warehouses: DbNamedEntity[];
  colors: DbNamedEntity[];
  sizes: DbNamedEntity[];
  materials: DbNamedEntity[];
  products: DbProduct[];
  posts: DbPost[];
  orders: DbOrder[];
  clients: DbClient[];
};

function calculateOrderTotal(items: DbOrderItem[]) {
  return items.reduce((sum, item) => {
    const price = Number.isFinite(item.price) ? item.price : 0;
    const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
    return sum + price * quantity;
  }, 0);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asTrimmedUniqueArray(value: unknown): string[] {
  return Array.from(new Set(asStringArray(value).map((item) => item.trim()).filter(Boolean)));
}

function asNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : [];
}

function asWarehouseStock(value: unknown, fallbackStock = 0): DbWarehouseStock[] {
  const normalized = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const warehouse = "warehouse" in item && typeof item.warehouse === "string" ? item.warehouse.trim() : "";
          const quantity =
            "quantity" in item && typeof item.quantity === "number" && Number.isFinite(item.quantity)
              ? Math.max(0, Math.trunc(item.quantity))
              : 0;

          if (!warehouse) {
            return null;
          }

          return { warehouse, quantity };
        })
        .filter((item): item is DbWarehouseStock => Boolean(item))
    : [];

  const grouped = new Map<string, number>();
  for (const entry of normalized) {
    grouped.set(entry.warehouse, (grouped.get(entry.warehouse) ?? 0) + entry.quantity);
  }

  const result = Array.from(grouped.entries())
    .map(([warehouse, quantity]) => ({ warehouse, quantity }))
    .filter((entry) => entry.quantity > 0);

  if (result.length === 0 && fallbackStock > 0) {
    return [{ warehouse: DEFAULT_WAREHOUSE_NAME, quantity: Math.max(0, Math.trunc(fallbackStock)) }];
  }

  return result;
}

function asLocaleMap(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function asNamedEntity(value: { name: string; nameI18n?: unknown }): DbNamedEntity {
  return {
    name: value.name,
    nameI18n: asLocaleMap(value.nameI18n)
  };
}
function asPostBlocks(value: unknown, content: string[]): DbPostBlock[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is DbPostBlock => Boolean(item && typeof item === "object" && "type" in item));
  }

  return content
    .filter(Boolean)
    .map((paragraph) => ({
      id: randomUUID(),
      type: "paragraph" as const,
      text: paragraph,
      align: "left" as const
    }));
}

type ProductRecord = Awaited<ReturnType<typeof prisma.product.findFirst>>;
type PostRecord = Awaited<ReturnType<typeof prisma.post.findFirst>>;
type OrderRecord = Awaited<ReturnType<typeof prisma.order.findFirst>>;
type ClientRecord = Awaited<ReturnType<typeof prisma.client.findFirst>>;

function buildBrandCodeMap(brands: Awaited<ReturnType<typeof prisma.brand.findMany>>) {
  return new Map(brands.map((brand, index) => [brand.name, String(index + 1).padStart(4, "0")]));
}

function buildProductSkuMap(
  products: Awaited<ReturnType<typeof prisma.product.findMany>>,
  brandCodeMap: Map<string, string>
) {
  const sorted = [...products].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const counters = new Map<string, number>();
  const skuMap = new Map<string, string>();

  for (const product of sorted) {
    const brandCode = brandCodeMap.get(product.brand) ?? "0000";
    const next = (counters.get(brandCode) ?? 0) + 1;
    counters.set(brandCode, next);
    skuMap.set(product.id, `${brandCode}-${next}`);
  }

  return skuMap;
}

function mapProduct(product: NonNullable<ProductRecord>, skuMap: Map<string, string>): DbProduct {
  const warehouseStock = asWarehouseStock(
    (product as { warehouseStock?: unknown }).warehouseStock,
    typeof product.stock === "number" ? product.stock : 0
  );
  const totalStock = warehouseStock.reduce((sum, entry) => sum + entry.quantity, 0);

  return {
    id: product.id,
    sku: skuMap.get(product.id) ?? "0000-0",
    code: (product as { code?: string }).code ?? "",
    group: (product as { group?: string }).group ?? "",
    variantColor: (product as { variantColor?: string }).variantColor ?? "",
    slug: product.slug,
    name: product.name,
    nameI18n: asLocaleMap((product as { nameI18n?: unknown }).nameI18n),
    status: product.status || (product.stock > 0 ? "Активен" : "Нет в наличии"),
    category: product.category,
    brand: product.brand || "Без бренда",
    size: product.size || "",
    centimeters: product.centimeters || "",
    ageGroup: product.ageGroup || "",
    audience: product.audience || "",
    season: product.season || "",
    price: product.price,
    oldPrice: product.oldPrice ?? null,
    stock: totalStock,
    material: product.material || "",
    colors: asStringArray(product.colors),
    materials: asTrimmedUniqueArray((product as { materials?: unknown }).materials).length > 0
      ? asTrimmedUniqueArray((product as { materials?: unknown }).materials)
      : (product.material ? [product.material] : []),
    sizes: asTrimmedUniqueArray((product as { sizes?: unknown }).sizes).length > 0
      ? asTrimmedUniqueArray((product as { sizes?: unknown }).sizes)
      : (product.size ? parseMultiValue(product.size) : []),
    badge: product.badge ?? null,
    description: product.description || "",
    descriptionI18n: asLocaleMap((product as { descriptionI18n?: unknown }).descriptionI18n),
    warehouseStock,
    image: product.image || DEFAULT_PRODUCT_IMAGE,
    images: uniqueImages([product.image || DEFAULT_PRODUCT_IMAGE, ...asStringArray(product.images)]),
    features: asStringArray(product.features),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

function mapPost(post: NonNullable<PostRecord>): DbPost {
  const content = asStringArray(post.content);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    titleI18n: asLocaleMap((post as { titleI18n?: unknown }).titleI18n),
    category: post.category,
    excerpt: post.excerpt,
    excerptI18n: asLocaleMap((post as { excerptI18n?: unknown }).excerptI18n),
    cover: post.cover,
    content,
    contentBlocks: asPostBlocks(post.contentBlocks, content),
    published: post.published,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  };
}

function mapOrder(order: NonNullable<OrderRecord>): DbOrder {
  const items = Array.isArray(order.items) ? (order.items as DbOrderItem[]) : [];
  const calculatedTotal = calculateOrderTotal(items);
  const managerComment = (order as { managerComment?: string }).managerComment ?? "";

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    comment: order.comment,
    managerComment,
    deliveryMethod: order.deliveryMethod,
    paymentMethod: order.paymentMethod,
    region: order.region,
    city: order.city,
    novaPoshtaType: order.novaPoshtaType,
    novaPoshtaBranch: order.novaPoshtaBranch,
    courierAddress: order.courierAddress,
    status: order.status,
    total: calculatedTotal > 0 ? calculatedTotal : order.total,
    items,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}

function mapClient(client: NonNullable<ClientRecord>): DbClient {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    orderIds: asStringArray(client.orderIds),
    orderNumbers: asNumberArray(client.orderNumbers),
    totalSpent: client.totalSpent,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString()
  };
}

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.map((item) => item.trim()).filter(Boolean)));
}

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL ?? "admin@standardshop.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return;
  }

  await prisma.adminUser.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      name: "Store Admin"
    }
  });
}

export async function ensureDb() {
  await ensureAdminUser();
}

export async function readDb(): Promise<Database> {
  await ensureDb();

  const prismaWithOptionalSeason = prisma as typeof prisma & {
    season?: {
      findMany: (args: { orderBy: { name: "asc" } }) => Promise<Array<{ name: string }>>;
    };
    warehouse?: {
      findMany: (args: { orderBy: { name: "asc" } }) => Promise<Array<{ name: string }>>;
    };
    color?: {
      findMany: (args: { orderBy: { name: "asc" } }) => Promise<Array<{ name: string }>>;
    };
    size?: {
      findMany: (args: { orderBy: { name: "asc" } }) => Promise<Array<{ name: string }>>;
    };
    material?: {
      findMany: (args: { orderBy: { name: "asc" } }) => Promise<Array<{ name: string }>>;
    };
  };

  const [adminUsers, categoryRows, brandRows, seasonRows, warehouseRows, colorRows, sizeRows, materialRows, products, posts, orders, clients] = await Promise.all([
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { createdAt: "asc" } }),
    prismaWithOptionalSeason.season?.findMany({ orderBy: { name: "asc" } }) ?? Promise.resolve([]),
    prismaWithOptionalSeason.warehouse?.findMany({ orderBy: { name: "asc" } }) ?? Promise.resolve([]),
    prismaWithOptionalSeason.color?.findMany({ orderBy: { name: "asc" } }) ?? Promise.resolve([]),
    prismaWithOptionalSeason.size?.findMany({ orderBy: { name: "asc" } }) ?? Promise.resolve([]),
    prismaWithOptionalSeason.material?.findMany({ orderBy: { name: "asc" } }) ?? Promise.resolve([]),
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.post.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ orderBy: { updatedAt: "desc" } })
  ]);

  const brandCodeMap = buildBrandCodeMap(brandRows);
  const productSkuMap = buildProductSkuMap(products, brandCodeMap);
  const mappedProducts = products.map((product) => mapProduct(product, productSkuMap));

  return {
    adminUsers: adminUsers.map((user) => ({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name ?? "",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    })),
    categories:
      categoryRows.length > 0
        ? categoryRows.map((item) => asNamedEntity({ name: item.name, nameI18n: (item as { nameI18n?: unknown }).nameI18n }))
        : [...new Set(mappedProducts.flatMap((item) => parseMultiValue(item.category)))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name })),
    brands:
      brandRows.length > 0
        ? brandRows.map((item) => asNamedEntity({ name: item.name, nameI18n: (item as { nameI18n?: unknown }).nameI18n }))
        : [...new Set(mappedProducts.map((item) => item.brand).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name })),
    seasons:
      seasonRows.length > 0
        ? seasonRows.map((item) => asNamedEntity({ name: item.name, nameI18n: (item as { nameI18n?: unknown }).nameI18n }))
        : [...new Set(mappedProducts.flatMap((item) => parseMultiValue(item.season)))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name })),
    warehouses:
      warehouseRows.length > 0
        ? warehouseRows.map((item) => asNamedEntity({ name: item.name, nameI18n: (item as { nameI18n?: unknown }).nameI18n }))
        : [...new Set(mappedProducts.flatMap((item) => item.warehouseStock.map((entry) => entry.warehouse)).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name })),
    colors:
      colorRows.length > 0
        ? colorRows.map((item) => asNamedEntity({ name: item.name, nameI18n: (item as { nameI18n?: unknown }).nameI18n }))
        : [...new Set(mappedProducts.flatMap((item) => item.colors))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name })),
    sizes:
      sizeRows.length > 0
        ? sizeRows.map((item) => asNamedEntity({ name: item.name, nameI18n: (item as { nameI18n?: unknown }).nameI18n }))
        : [...new Set(mappedProducts.flatMap((item) => item.sizes))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name })),
    materials:
      materialRows.length > 0
        ? materialRows.map((item) => asNamedEntity({ name: item.name, nameI18n: (item as { nameI18n?: unknown }).nameI18n }))
        : [...new Set(mappedProducts.flatMap((item) => item.materials))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name })),
    products: mappedProducts,
    posts: posts.map(mapPost),
    orders: orders.map(mapOrder),
    clients: clients.map(mapClient)
  };
}

export async function writeDb(data: Database) {
  await ensureDb();

  const prismaWithOptionalSeason = prisma as typeof prisma & {
    season?: {
      deleteMany: () => Promise<unknown>;
      create: (args: { data: { name: string } }) => Promise<unknown>;
    };
    warehouse?: {
      deleteMany: () => Promise<unknown>;
      create: (args: { data: { name: string } }) => Promise<unknown>;
    };
    color?: {
      deleteMany: () => Promise<unknown>;
      create: (args: { data: { name: string } }) => Promise<unknown>;
    };
    size?: {
      deleteMany: () => Promise<unknown>;
      create: (args: { data: { name: string } }) => Promise<unknown>;
    };
    material?: {
      deleteMany: () => Promise<unknown>;
      create: (args: { data: { name: string } }) => Promise<unknown>;
    };
  };

  await prisma.client.deleteMany();
  await prisma.order.deleteMany();
  await prisma.post.deleteMany();
  await prisma.product.deleteMany();
  if (prismaWithOptionalSeason.season) {
    await prismaWithOptionalSeason.season.deleteMany();
  }
  if (prismaWithOptionalSeason.warehouse) {
    await prismaWithOptionalSeason.warehouse.deleteMany();
  }
  if (prismaWithOptionalSeason.color) {
    await prismaWithOptionalSeason.color.deleteMany();
  }
  if (prismaWithOptionalSeason.size) {
    await prismaWithOptionalSeason.size.deleteMany();
  }
  if (prismaWithOptionalSeason.material) {
    await prismaWithOptionalSeason.material.deleteMany();
  }
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  const envEmail = process.env.ADMIN_EMAIL ?? "admin@standardshop.local";
  const existingAdmins = await prisma.adminUser.findMany();
  const incomingAdmins =
    data.adminUsers.length > 0
      ? data.adminUsers
      : existingAdmins.map((user) => ({
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name ?? "",
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }));

  const incomingIds = new Set(incomingAdmins.map((item) => item.id));
  const removableAdminIds = existingAdmins
    .filter((item) => item.email !== envEmail && !incomingIds.has(item.id))
    .map((item) => item.id);

  if (removableAdminIds.length > 0) {
    await prisma.adminUser.deleteMany({ where: { id: { in: removableAdminIds } } });
  }

  for (const admin of incomingAdmins) {
    await prisma.adminUser.upsert({
      where: { id: admin.id },
      update: {
        email: admin.email,
        passwordHash: admin.passwordHash,
        name: admin.name,
        createdAt: new Date(admin.createdAt),
        updatedAt: new Date(admin.updatedAt)
      },
      create: {
        id: admin.id,
        email: admin.email,
        passwordHash: admin.passwordHash,
        name: admin.name,
        createdAt: new Date(admin.createdAt),
        updatedAt: new Date(admin.updatedAt)
      }
    });
  }

  for (const category of Array.from(new Map(data.categories.map((item) => [item.name.trim(), item])).values()).filter((item) => item.name)) {
    await prisma.category.create({ data: { name: category.name } });
    await prisma.$executeRaw`UPDATE "Category" SET "nameI18n" = ${JSON.stringify(category.nameI18n ?? null)}::jsonb WHERE "name" = ${category.name}`;
  }

  for (const brand of Array.from(new Map(data.brands.map((item) => [item.name.trim(), item])).values()).filter((item) => item.name)) {
    await prisma.brand.create({ data: { name: brand.name } });
    await prisma.$executeRaw`UPDATE "Brand" SET "nameI18n" = ${JSON.stringify(brand.nameI18n ?? null)}::jsonb WHERE "name" = ${brand.name}`;
  }

  if (prismaWithOptionalSeason.season) {
    for (const season of Array.from(new Map(data.seasons.map((item) => [item.name.trim(), item])).values()).filter((item) => item.name)) {
      await prismaWithOptionalSeason.season.create({ data: { name: season.name } });
      await prisma.$executeRaw`UPDATE "Season" SET "nameI18n" = ${JSON.stringify(season.nameI18n ?? null)}::jsonb WHERE "name" = ${season.name}`;
    }
  }

  const warehouseNames = Array.from(
    new Set([
      ...data.warehouses.map((item) => item.name.trim()).filter(Boolean),
      ...data.products.flatMap((product) => product.warehouseStock.map((entry) => entry.warehouse.trim())).filter(Boolean)
    ])
  );

  if (prismaWithOptionalSeason.warehouse) {
    for (const warehouse of warehouseNames) {
      const warehouseEntity = data.warehouses.find((item) => item.name === warehouse);
      await prismaWithOptionalSeason.warehouse.create({ data: { name: warehouse } });
      await prisma.$executeRaw`UPDATE "Warehouse" SET "nameI18n" = ${JSON.stringify(warehouseEntity?.nameI18n ?? null)}::jsonb WHERE "name" = ${warehouse}`;
    }
  }

  if (prismaWithOptionalSeason.color) {
    for (const color of Array.from(new Set([
      ...data.colors.map((item) => item.name.trim()).filter(Boolean),
      ...data.products.flatMap((product) => product.colors.map((item) => item.trim())).filter(Boolean)
    ]))) {
      await prismaWithOptionalSeason.color.create({ data: { name: color } });
      await prisma.$executeRaw`UPDATE "Color" SET "nameI18n" = ${JSON.stringify(data.colors.find((item) => item.name === color)?.nameI18n ?? null)}::jsonb WHERE "name" = ${color}`;
    }
  }

  if (prismaWithOptionalSeason.size) {
    for (const size of Array.from(new Set([
      ...data.sizes.map((item) => item.name.trim()).filter(Boolean),
      ...data.products.flatMap((product) => product.sizes.map((item) => item.trim())).filter(Boolean)
    ]))) {
      await prismaWithOptionalSeason.size.create({ data: { name: size } });
      await prisma.$executeRaw`UPDATE "Size" SET "nameI18n" = ${JSON.stringify(data.sizes.find((item) => item.name === size)?.nameI18n ?? null)}::jsonb WHERE "name" = ${size}`;
    }
  }

  if (prismaWithOptionalSeason.material) {
    for (const material of Array.from(new Set([
      ...data.materials.map((item) => item.name.trim()).filter(Boolean),
      ...data.products.flatMap((product) => product.materials.map((item) => item.trim())).filter(Boolean)
    ]))) {
      await prismaWithOptionalSeason.material.create({ data: { name: material } });
      await prisma.$executeRaw`UPDATE "Material" SET "nameI18n" = ${JSON.stringify(data.materials.find((item) => item.name === material)?.nameI18n ?? null)}::jsonb WHERE "name" = ${material}`;
    }
  }

  for (const product of data.products) {
    const warehouseStock = asWarehouseStock(product.warehouseStock, product.stock);
    const totalStock = warehouseStock.reduce((sum, entry) => sum + entry.quantity, 0);
    const productSizes = Array.from(new Set(product.sizes.map((item) => item.trim()).filter(Boolean)));
    const productMaterials = Array.from(new Set(product.materials.map((item) => item.trim()).filter(Boolean)));
    const productColors = Array.from(new Set(product.colors.map((item) => item.trim()).filter(Boolean)));

    await prisma.product.create({
      data: {
        id: product.id,
        code: product.code,
        group: product.group,
        variantColor: product.variantColor,
        slug: product.slug,
        name: product.name,
        status: product.status,
        category: product.category,
        brand: product.brand,
        size: productSizes.join(" | "),
        centimeters: product.centimeters,
        ageGroup: product.ageGroup,
        audience: product.audience,
        season: product.season,
        price: product.price,
        oldPrice: product.oldPrice,
        stock: totalStock,
        material: productMaterials.join(", "),
        colors: productColors,
        badge: product.badge,
        description: product.description,
        warehouseStock,
        image: product.image,
        images: uniqueImages([product.image, ...product.images]),
        features: product.features,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }
    });
    await prisma.$executeRaw`
      UPDATE "Product"
      SET
        "nameI18n" = ${JSON.stringify(product.nameI18n ?? null)}::jsonb,
        "descriptionI18n" = ${JSON.stringify(product.descriptionI18n ?? null)}::jsonb,
        "colors" = ${JSON.stringify(productColors)}::jsonb,
        "features" = ${JSON.stringify(product.features)}::jsonb,
        "images" = ${JSON.stringify(uniqueImages([product.image, ...product.images]))}::jsonb,
        "warehouseStock" = ${JSON.stringify(warehouseStock)}::jsonb,
        "size" = ${productSizes.join(" | ")},
        "material" = ${productMaterials.join(", ")}
      WHERE "id" = ${product.id}
    `;
  }

  for (const post of data.posts) {
    await prisma.post.create({
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        category: post.category,
        excerpt: post.excerpt,
        cover: post.cover,
        content: post.content,
        contentBlocks: post.contentBlocks && post.contentBlocks.length > 0 ? post.contentBlocks : Prisma.JsonNull,
        published: post.published,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt)
      }
    });
    await prisma.$executeRaw`
      UPDATE "Post"
      SET
        "titleI18n" = ${JSON.stringify(post.titleI18n ?? null)}::jsonb,
        "excerptI18n" = ${JSON.stringify(post.excerptI18n ?? null)}::jsonb
      WHERE "id" = ${post.id}
    `;
  }

  for (const order of data.orders) {
    await prisma.order.create({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        comment: order.comment,
        deliveryMethod: order.deliveryMethod,
        paymentMethod: order.paymentMethod,
        region: order.region,
        city: order.city,
        novaPoshtaType: order.novaPoshtaType,
        novaPoshtaBranch: order.novaPoshtaBranch,
        courierAddress: order.courierAddress,
        status: order.status,
        total: order.total,
        items: order.items,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt)
      }
    });
    await prisma.$executeRaw`
      UPDATE "Order"
      SET "managerComment" = ${order.managerComment}
      WHERE "id" = ${order.id}
    `;
  }

  for (const client of data.clients) {
    await prisma.client.create({
      data: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        orderIds: client.orderIds,
        orderNumbers: client.orderNumbers,
        totalSpent: client.totalSpent,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt)
      }
    });
  }
}

export function stampNow() {
  return new Date().toISOString();
}



