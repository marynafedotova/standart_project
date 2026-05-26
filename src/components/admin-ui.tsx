"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { DbPostBlock } from "@/lib/json-db";

type WarehouseStockEntry = {
  warehouse: string;
  quantity: number;
};

type AdminProduct = {
  id: string;
  sku: string;
  code: string;
  group: string;
  variantColor: string;
  name: string;
  nameI18n?: Record<string, string>;
  slug: string;
  status: string;
  category: string;
  brand: string;
  size: string;
  sizes: string[];
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
  badge: string | null;
  description: string;
  descriptionI18n?: Record<string, string>;
  warehouseStock: WarehouseStockEntry[];
  image: string;
  images: string[];
  features: string[];
};

type AdminPost = {
  id: string;
  title: string;
  titleI18n?: Record<string, string>;
  slug: string;
  category: string;
  excerpt: string;
  excerptI18n?: Record<string, string>;
  cover: string;
  content: string[];
  contentBlocks?: DbPostBlock[];
  published: boolean;
  createdAt: Date;
};

type NavGroup = {
  title: string;
  hrefs: string[];
  links: Array<{ href: string; label: string }>;
};

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "Головна",
    hrefs: ["/admin/home"],
    links: [{ href: "/admin/home", label: "Hero-секція" }]
  },
  {
    title: "Товари",
    hrefs: [
      "/admin/products",
      "/admin/product",
      "/admin/categories",
      "/admin/brands",
      "/admin/seasons",
      "/admin/colors",
      "/admin/sizes",
      "/admin/materials",
      "/admin/warehouses"
    ],
    links: [
      { href: "/admin/products", label: "Усі товари" },
      { href: "/admin/product/new", label: "Новий товар" },
      { href: "/admin/categories", label: "Категорії" },
      { href: "/admin/brands", label: "Бренди" },
      { href: "/admin/seasons", label: "Сезони" },
      { href: "/admin/colors", label: "Кольори" },
      { href: "/admin/sizes", label: "Розміри" },
      { href: "/admin/materials", label: "Матеріали" },
      { href: "/admin/warehouses", label: "Склади" }
    ]
  },
  {
    title: "Замовлення",
    hrefs: ["/admin/orders"],
    links: [
      { href: "/admin/orders", label: "Усі замовлення" },
      { href: "/admin/orders/new", label: "Нове замовлення" }
    ]
  },
  {
    title: "Клієнти",
    hrefs: ["/admin/clients"],
    links: [{ href: "/admin/clients", label: "База клієнтів" }]
  },
  {
    title: "Контент",
    hrefs: ["/admin/news", "/admin/post"],
    links: [
      { href: "/admin/news", label: "Новини" },
      { href: "/admin/post/new", label: "Новий допис" }
    ]
  },
  {
    title: "Команда",
    hrefs: ["/admin/employees", "/admin/knowledge"],
    links: [
      { href: "/admin/employees", label: "Співробітники" },
      { href: "/admin/knowledge", label: "База знань" }
    ]
  }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupOpen(pathname: string, group: NavGroup) {
  return group.hrefs.some((href) => isActivePath(pathname, href));
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLoginPage = pathname === "/admin/login" || pathname.endsWith("/admin/login");

  if (isLoginPage) {
    return <div className="adminContent adminContentWide">{children}</div>;
  }

  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <Link href="/" className="brand">
          Standard Shop
        </Link>
        <span className="sidebarLabel">Адмін-панель</span>

        <nav className="adminNavGroups">
          {ADMIN_NAV_GROUPS.map((group) => (
            <details key={group.title} className="adminNavGroup" open={isGroupOpen(pathname, group)}>
              <summary className="adminNavHeading">{group.title}</summary>
              <div className="adminNav">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className={isActivePath(pathname, link.href) ? "active" : undefined}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
      </aside>
      <div className="adminContent">{children}</div>
    </div>
  );
}

export function AdminProductsList({ products }: { products: AdminProduct[] }) {
  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Товари</span>
          <h1>Список товарів</h1>
        </div>
        <Link href="/admin/product/new" className="button primary">
          Створити товар
        </Link>
      </div>
      <div className="panel toolbar">
        <input type="search" placeholder="Пошук за назвою або SKU" disabled />
        <select defaultValue="all" disabled>
          <option value="all">Усі категорії</option>
        </select>
        <select defaultValue="active" disabled>
          <option value="active">Активні</option>
        </select>
      </div>
      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Назва</th>
              <th>Категорія</th>
              <th>Ціна</th>
              <th>Залишок</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link href={`/admin/product/${product.id}`}>{product.sku}</Link>
                </td>
                <td>
                  <Link href={`/admin/product/${product.id}`}>{product.name}</Link>
                </td>
                <td>{product.category}</td>
                <td>{product.price} грн</td>
                <td>{product.stock}</td>
                <td>{product.stock > 0 ? "Активний" : "Немає в наявності"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminNewsList({ posts }: { posts: AdminPost[] }) {
  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Новини</span>
          <h1>Список дописів</h1>
        </div>
        <Link href="/admin/post/new" className="button primary">
          Створити допис
        </Link>
      </div>
      <div className="blogGrid">
        {posts.map((post) => (
          <article key={post.id} className="panel">
            <div className="metaLine">
              <span>{post.category}</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <Link href={`/admin/post/${post.id}`}>Редагувати</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export type { AdminPost, AdminProduct };
