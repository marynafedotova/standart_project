import Link from "next/link";
import type { DbPostBlock } from "@/lib/json-db";
import type { ReactNode } from "react";

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

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <Link href="/" className="brand">Standard Shop</Link>
        <span className="sidebarLabel">Адмін-панель</span>
        <nav className="adminNavGroups">
          <div className="adminNavGroup">
            <span className="adminNavHeading">Товари</span>
            <div className="adminNav">
              <Link href="/admin/products">Усі товари</Link>
              <Link href="/admin/product/new">Новий товар</Link>
              <Link href="/admin/categories">Категорії</Link>
              <Link href="/admin/brands">Бренди</Link>
              <Link href="/admin/seasons">Сезони</Link>
              <Link href="/admin/colors">Кольори</Link>
              <Link href="/admin/sizes">Розміри</Link>
              <Link href="/admin/materials">Матеріали</Link>
              <Link href="/admin/warehouses">Склади</Link>
            </div>
          </div>

          <div className="adminNavGroup">
            <span className="adminNavHeading">Замовлення</span>
            <div className="adminNav">
              <Link href="/admin/orders">Усі замовлення</Link>
              <Link href="/admin/orders/new">Нове замовлення</Link>
            </div>
          </div>

          <div className="adminNavGroup">
            <span className="adminNavHeading">Клієнти</span>
            <div className="adminNav">
              <Link href="/admin/clients">База клієнтів</Link>
            </div>
          </div>

          <div className="adminNavGroup">
            <span className="adminNavHeading">Контент</span>
            <div className="adminNav">
              <Link href="/admin/news">Новини</Link>
              <Link href="/admin/post/new">Новий допис</Link>
            </div>
          </div>
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
        <Link href="/admin/product/new" className="button primary">Створити товар</Link>
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
                    <Link href={`/admin/product/${product.id}`}>
                      {product.sku}
                    </Link>
                  </td>
                <td><Link href={`/admin/product/${product.id}`}>{product.name}</Link></td>
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
        <Link href="/admin/post/new" className="button primary">Створити допис</Link>
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
