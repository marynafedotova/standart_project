import Link from "next/link";
import type { DbPostBlock } from "@/lib/json-db";
import type { ReactNode } from "react";

type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
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
  badge: string | null;
  description: string;
  image: string;
  images: string[];
  features: string[];
};

type AdminPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
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
        <span className="sidebarLabel">Админ-панель</span>
        <nav className="adminNavGroups">
          <div className="adminNavGroup">
            <span className="adminNavHeading">Товары</span>
            <div className="adminNav">
              <Link href="/admin/products">Все товары</Link>
              <Link href="/admin/product/new">Новый товар</Link>
              <Link href="/admin/categories">Категории</Link>
              <Link href="/admin/brands">Бренды</Link>
              <Link href="/admin/seasons">Сезоны</Link>
            </div>
          </div>

          <div className="adminNavGroup">
            <span className="adminNavHeading">Заказы</span>
            <div className="adminNav">
              <Link href="/admin/orders">Все заказы</Link>
              <Link href="/admin/orders/new">Новый заказ</Link>
            </div>
          </div>

          <div className="adminNavGroup">
            <span className="adminNavHeading">Клиенты</span>
            <div className="adminNav">
              <Link href="/admin/clients">База клиентов</Link>
            </div>
          </div>

          <div className="adminNavGroup">
            <span className="adminNavHeading">Контент</span>
            <div className="adminNav">
              <Link href="/admin/news">Новости</Link>
              <Link href="/admin/post/new">Новый пост</Link>
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
          <span className="eyebrow">Товары</span>
          <h1>Список товаров</h1>
        </div>
        <Link href="/admin/product/new" className="button primary">Создать товар</Link>
      </div>
      <div className="panel toolbar">
        <input type="search" placeholder="Поиск по названию или SKU" disabled />
        <select defaultValue="all" disabled>
          <option value="all">Все категории</option>
        </select>
        <select defaultValue="active" disabled>
          <option value="active">Активные</option>
        </select>
      </div>
      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.sku}</td>
                <td><Link href={`/admin/product/${product.id}`}>{product.name}</Link></td>
                <td>{product.category}</td>
                <td>{product.price} грн</td>
                <td>{product.stock}</td>
                <td>{product.stock > 0 ? "Активен" : "Нет в наличии"}</td>
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
          <span className="eyebrow">Новости</span>
          <h1>Список постов</h1>
        </div>
        <Link href="/admin/post/new" className="button primary">Создать пост</Link>
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
            <Link href={`/admin/post/${post.id}`}>Редактировать</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export type { AdminPost, AdminProduct };
