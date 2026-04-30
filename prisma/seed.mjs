import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const dbJsonPath = path.join(process.cwd(), "data", "db.json");

const fallbackData = {
  adminUsers: [],
  categories: ["Хит", "Новинки", "Аксессуары"],
  brands: ["Standard Home", "Mono Audio", "Terra Life"],
  seasons: ["Всесезонный", "Лето"],
  products: [
    {
      slug: "aurora-lamp",
      name: "Aurora Lamp",
      category: "Хит",
      brand: "Standard Home",
      size: "M",
      centimeters: "32 x 18 см",
      ageGroup: "18+",
      audience: "Для дома и подарка",
      season: "Всесезонный",
      price: 2490,
      oldPrice: 2990,
      stock: 18,
      material: "Алюминий",
      colors: ["Песочный", "Белый"],
      badge: "Топ продаж",
      description: "Универсальная карточка товара для любой ниши: декор, техника, аксессуары или косметика.",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"],
      features: ["3 режима подсветки", "Гарантия 12 месяцев", "Быстрая доставка"]
    },
    {
      slug: "mono-speaker",
      name: "Mono Speaker",
      category: "Новинки",
      brand: "Mono Audio",
      size: "L",
      centimeters: "25 x 25 см",
      ageGroup: "16+",
      audience: "Для взрослых",
      season: "Всесезонный",
      price: 3190,
      oldPrice: null,
      stock: 9,
      material: "Ткань",
      colors: ["Графит", "Черный"],
      badge: "New",
      description: "Пример подачи технологичного продукта с акцентом на характеристики и стиль.",
      image: "https://images.unsplash.com/photo-1512446733611-9099a758e0b0?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1512446733611-9099a758e0b0?auto=format&fit=crop&w=1200&q=80"],
      features: ["Bluetooth 5.3", "До 18 часов автономности", "IPX5"]
    },
    {
      slug: "terra-bottle",
      name: "Terra Bottle",
      category: "Аксессуары",
      brand: "Terra Life",
      size: "750 мл",
      centimeters: "28 см",
      ageGroup: "12+",
      audience: "Для взрослых и подростков",
      season: "Лето",
      price: 890,
      oldPrice: null,
      stock: 42,
      material: "Сталь",
      colors: ["Оливковый", "Серебристый"],
      badge: null,
      description: "Хороший пример адаптации шаблона под аксессуары, спорттовары или lifestyle-продукты.",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80"],
      features: ["750 мл", "Термоэффект 12 часов", "Без BPA"]
    }
  ],
  posts: [
    {
      slug: "adapt-template-any-niche",
      title: "Как адаптировать шаблон под любую товарную нишу",
      category: "Маркетинг",
      excerpt: "Что менять в первую очередь, если вы продаете другой продукт и хотите быстро стартовать.",
      cover: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
      content: [
        "Начните с главного hero-блока и ключевого предложения бренда.",
        "После этого адаптируйте фильтры каталога, характеристики товара и юридические страницы."
      ],
      contentBlocks: [
        { id: "seed-post-1-1", type: "heading", text: "С чего начать", level: 2, align: "left" },
        { id: "seed-post-1-2", type: "paragraph", text: "Начните с главного hero-блока и ключевого предложения бренда.", align: "left" },
        { id: "seed-post-1-3", type: "paragraph", text: "После этого адаптируйте фильтры каталога, характеристики товара и юридические страницы.", align: "left" }
      ]
    },
    {
      slug: "must-have-pages",
      title: "Какие страницы нужны стандартному интернет-магазину",
      category: "Бизнес",
      excerpt: "Короткий чеклист обязательных страниц, которые повышают доверие и упрощают запуск.",
      cover: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      content: [
        "Кроме каталога и карточки товара, важно иметь контакты, блог, политику конфиденциальности и оферту.",
        "В этом шаблоне все эти маршруты уже предусмотрены, поэтому можно сосредоточиться на бизнес-логике."
      ],
      contentBlocks: [
        { id: "seed-post-2-1", type: "paragraph", text: "Кроме каталога и карточки товара, важно иметь контакты, блог, политику конфиденциальности и оферту.", align: "left" },
        { id: "seed-post-2-2", type: "list", items: ["Каталог", "Продукт", "Контакты", "Блог", "Политика и оферта"] },
        { id: "seed-post-2-3", type: "paragraph", text: "В этом шаблоне все эти маршруты уже предусмотрены, поэтому можно сосредоточиться на бизнес-логике.", align: "left" }
      ]
    }
  ],
  orders: [],
  clients: []
};

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim().length > 0) : [];
}

function asNumberArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "number" && Number.isFinite(item)) : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function toDate(value) {
  const date = new Date(typeof value === "string" ? value : "");
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizePostBlocks(contentBlocks, content) {
  if (Array.isArray(contentBlocks) && contentBlocks.length > 0) {
    return contentBlocks;
  }

  return asStringArray(content).map((text) => ({
    id: randomUUID(),
    type: "paragraph",
    text,
    align: "left"
  }));
}

function normalizeProduct(product) {
  const image = asString(product.image, "/images/product-placeholder.svg");
  const colors = uniqueStrings([
    ...asStringArray(product.colors),
    asString(product.color)
  ]);

  return {
    id: asString(product.id, randomUUID()),
    slug: asString(product.slug, randomUUID()),
    name: asString(product.name, "Без названия"),
    nameI18n: asObject(product.nameI18n) ?? null,
    status: asString(product.status, asNumber(product.stock, 0) > 0 ? "Активен" : "Нет в наличии"),
    category: asString(product.category),
    brand: asString(product.brand),
    size: asString(product.size),
    centimeters: asString(product.centimeters),
    ageGroup: asString(product.ageGroup),
    audience: asString(product.audience),
    season: asString(product.season),
    price: asNumber(product.price),
    oldPrice: product.oldPrice == null ? null : asNumber(product.oldPrice),
    stock: asNumber(product.stock),
    material: asString(product.material),
    colors,
    badge: product.badge == null ? null : asString(product.badge),
    description: asString(product.description),
    descriptionI18n: asObject(product.descriptionI18n) ?? null,
    image,
    images: uniqueStrings([image, ...asStringArray(product.images)]),
    features: asStringArray(product.features),
    createdAt: toDate(product.createdAt),
    updatedAt: toDate(product.updatedAt)
  };
}

function normalizePost(post) {
  const content = asStringArray(post.content);

  return {
    id: asString(post.id, randomUUID()),
    slug: asString(post.slug, randomUUID()),
    title: asString(post.title, "Без названия"),
    titleI18n: asObject(post.titleI18n) ?? null,
    category: asString(post.category),
    excerpt: asString(post.excerpt),
    excerptI18n: asObject(post.excerptI18n) ?? null,
    cover: asString(post.cover),
    content,
    contentBlocks: normalizePostBlocks(post.contentBlocks, content),
    published: asBoolean(post.published, true),
    createdAt: toDate(post.createdAt),
    updatedAt: toDate(post.updatedAt)
  };
}

function normalizeOrderItem(item) {
  return {
    productId: asString(item?.productId),
    name: asString(item?.name),
    price: asNumber(item?.price),
    quantity: asNumber(item?.quantity, 1)
  };
}

function normalizeOrder(order) {
  const items = Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : [];
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    id: asString(order.id, randomUUID()),
    orderNumber: asNumber(order.orderNumber),
    customerName: asString(order.customerName),
    phone: asString(order.phone),
    email: asString(order.email),
    comment: asString(order.comment),
    managerComment: asString(order.managerComment),
    deliveryMethod: asString(order.deliveryMethod),
    paymentMethod: asString(order.paymentMethod),
    region: asString(order.region),
    city: asString(order.city),
    novaPoshtaType: asString(order.novaPoshtaType),
    novaPoshtaBranch: asString(order.novaPoshtaBranch),
    courierAddress: asString(order.courierAddress),
    status: asString(order.status, "Новый"),
    total: total || asNumber(order.total),
    items,
    createdAt: toDate(order.createdAt),
    updatedAt: toDate(order.updatedAt)
  };
}

function normalizeClient(client) {
  return {
    id: asString(client.id, randomUUID()),
    name: asString(client.name),
    phone: asString(client.phone),
    email: asString(client.email),
    orderIds: asStringArray(client.orderIds),
    orderNumbers: asNumberArray(client.orderNumbers),
    totalSpent: asNumber(client.totalSpent),
    createdAt: toDate(client.createdAt),
    updatedAt: toDate(client.updatedAt)
  };
}

function loadSourceData() {
  if (!existsSync(dbJsonPath)) {
    return fallbackData;
  }

  const raw = JSON.parse(readFileSync(dbJsonPath, "utf8"));

  return {
    adminUsers: Array.isArray(raw.adminUsers) ? raw.adminUsers : [],
    categories: Array.isArray(raw.categories) ? raw.categories : fallbackData.categories,
    brands: Array.isArray(raw.brands) ? raw.brands : fallbackData.brands,
    seasons: Array.isArray(raw.seasons) ? raw.seasons : fallbackData.seasons,
    products: Array.isArray(raw.products) && raw.products.length > 0 ? raw.products : fallbackData.products,
    posts: Array.isArray(raw.posts) && raw.posts.length > 0 ? raw.posts : fallbackData.posts,
    orders: Array.isArray(raw.orders) ? raw.orders : [],
    clients: Array.isArray(raw.clients) ? raw.clients : []
  };
}

async function main() {
  const source = loadSourceData();
  const email = process.env.ADMIN_EMAIL ?? "admin@standardshop.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const products = source.products.map(normalizeProduct);
  const posts = source.posts.map(normalizePost);
  const orders = source.orders.map(normalizeOrder);
  const clients = source.clients.map(normalizeClient);

  const categories = uniqueStrings([
    ...source.categories.filter((item) => typeof item === "string"),
    ...products.flatMap((product) => product.category.split("|")).map((item) => item.trim())
  ]);
  const brands = uniqueStrings([
    ...source.brands.filter((item) => typeof item === "string"),
    ...products.map((product) => product.brand)
  ]);
  const seasons = uniqueStrings([
    ...source.seasons.filter((item) => typeof item === "string"),
    ...products.flatMap((product) => product.season.split("|")).map((item) => item.trim())
  ]);

  await prisma.client.deleteMany();
  await prisma.order.deleteMany();
  await prisma.post.deleteMany();
  await prisma.product.deleteMany();
  await prisma.season.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();

  for (const admin of source.adminUsers) {
    await prisma.adminUser.create({
      data: {
        id: asString(admin.id, randomUUID()),
        email: asString(admin.email),
        passwordHash: asString(admin.passwordHash),
        name: asString(admin.name),
        createdAt: toDate(admin.createdAt),
        updatedAt: toDate(admin.updatedAt)
      }
    });
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name: "Store Admin" },
    create: {
      email,
      passwordHash,
      name: "Store Admin"
    }
  });

  for (const category of categories) {
    await prisma.category.create({ data: { name: category } });
  }

  for (const brand of brands) {
    await prisma.brand.create({ data: { name: brand } });
  }

  for (const season of seasons) {
    await prisma.season.create({ data: { name: season } });
  }

  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        nameI18n: product.nameI18n ?? Prisma.JsonNull,
        status: product.status,
        category: product.category,
        brand: product.brand,
        size: product.size,
        centimeters: product.centimeters,
        ageGroup: product.ageGroup,
        audience: product.audience,
        season: product.season,
        price: product.price,
        oldPrice: product.oldPrice,
        stock: product.stock,
        material: product.material,
        colors: product.colors,
        badge: product.badge,
        description: product.description,
        descriptionI18n: product.descriptionI18n ?? Prisma.JsonNull,
        image: product.image,
        images: product.images,
        features: product.features,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    });
  }

  for (const post of posts) {
    await prisma.post.create({
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        titleI18n: post.titleI18n ?? Prisma.JsonNull,
        category: post.category,
        excerpt: post.excerpt,
        excerptI18n: post.excerptI18n ?? Prisma.JsonNull,
        cover: post.cover,
        content: post.content,
        contentBlocks: post.contentBlocks?.length ? post.contentBlocks : Prisma.JsonNull,
        published: post.published,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });
  }

  for (const order of orders) {
    await prisma.order.create({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        comment: order.comment,
        managerComment: order.managerComment,
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
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  }

  for (const client of clients) {
    await prisma.client.create({
      data: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        orderIds: client.orderIds,
        orderNumbers: client.orderNumbers,
        totalSpent: client.totalSpent,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
