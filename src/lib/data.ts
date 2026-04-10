export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  material: string;
  color: string;
  image: string;
  description: string;
  badge: string | null;
  features: string[];
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover: string;
  date: string;
  content: string[];
};

export const categories = ["Усі", "Хіт", "Новинки", "Аксесуари"];

export const products: Product[] = [
  {
    id: "demo-1",
    slug: "aurora-lamp",
    name: "Aurora Lamp",
    category: "Хіт",
    price: 2490,
    oldPrice: 2990,
    stock: 18,
    material: "Алюміній",
    color: "Пісочний",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    description: "Демо-товар для старих компонентів адмінки та вітрини.",
    badge: "Топ продаж",
    features: ["3 режими підсвітки", "Гарантія 12 місяців", "Швидка доставка"]
  },
  {
    id: "demo-2",
    slug: "mono-speaker",
    name: "Mono Speaker",
    category: "Новинки",
    price: 3190,
    oldPrice: null,
    stock: 9,
    material: "Тканина",
    color: "Графіт",
    image: "https://images.unsplash.com/photo-1512446733611-9099a758e0b0?auto=format&fit=crop&w=1200&q=80",
    description: "Ще один демо-товар для сумісності зі старим кодом.",
    badge: "New",
    features: ["Bluetooth 5.3", "До 18 годин автономності", "IPX5"]
  },
  {
    id: "demo-3",
    slug: "terra-bottle",
    name: "Terra Bottle",
    category: "Аксесуари",
    price: 890,
    oldPrice: null,
    stock: 42,
    material: "Сталь",
    color: "Оливковий",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80",
    description: "Демо-аксесуар для збереження сумісності старих імпортів.",
    badge: null,
    features: ["750 мл", "Термоефект 12 годин", "Без BPA"]
  }
];

export const posts: Post[] = [
  {
    id: "post-1",
    slug: "adapt-template-any-niche",
    title: "Як адаптувати шаблон під будь-яку товарну нішу",
    category: "Маркетинг",
    excerpt: "Що змінювати в першу чергу, якщо ви продаєте інший продукт.",
    cover: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    date: "01 квітня 2026",
    content: [
      "Почніть із головного hero-блоку і ключової пропозиції бренду.",
      "Після цього адаптуйте фільтри каталогу, характеристики товару і юридичні сторінки."
    ]
  },
  {
    id: "post-2",
    slug: "must-have-pages",
    title: "Які сторінки потрібні стандартному інтернет-магазину",
    category: "Бізнес",
    excerpt: "Короткий чекліст обов'язкових сторінок для запуску магазину.",
    cover: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    date: "01 квітня 2026",
    content: [
      "Крім каталогу і картки товару, важливо мати контакти, блог, політику конфіденційності та оферту.",
      "У цьому шаблоні всі ці маршрути вже передбачені."
    ]
  }
];
