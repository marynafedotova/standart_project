import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = ["Хит", "Новинки", "Аксессуары"];
const brands = ["Standard Home", "Mono Audio", "Terra Life"];
const seasons = ["Всесезонный", "Лето"];

const products = [
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
    features: ["750 мл", "Термоэффект 12 часов", "Без BPA"]
  }
];

const posts = [
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
];

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@standardshop.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

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
    await prisma.category.upsert({
      where: { name: category },
      update: {},
      create: { name: category }
    });
  }

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { name: brand },
      update: {},
      create: { name: brand }
    });
  }

  for (const season of seasons) {
    await prisma.season.upsert({
      where: { name: season },
      update: {},
      create: { name: season }
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product
    });
  }

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: post,
      create: post
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
