import Link from "next/link";
import type { ReactNode } from "react";
import { posts, products } from "../lib/data";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <Link href="/" className="brand">Standard Shop</Link>
        <span className="sidebarLabel">Админ-панель</span>
        <nav className="adminNav">
          <Link href="/admin/products">Список товаров</Link>
          <Link href="/admin/product/new">Создать товар</Link>
          <Link href="/admin/news">Новости</Link>
          <Link href="/admin/post/new">Написать пост</Link>
        </nav>
      </aside>
      <div className="adminContent">{children}</div>
    </div>
  );
}

export function AdminProductsSection() {
  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Товары</span>
          <h1>Перечень всей продукции с фильтрами</h1>
        </div>
        <Link href="/admin/product/new" className="button primary">Создать продукт</Link>
      </div>
      <div className="panel toolbar">
        <input type="search" placeholder="Поиск по названию или SKU" />
        <select defaultValue="all">
          <option value="all">Все категории</option>
          <option value="hit">Хит</option>
          <option value="new">Новинки</option>
          <option value="premium">Премиум</option>
        </select>
        <select defaultValue="active">
          <option value="active">Активные</option>
          <option value="draft">Черновики</option>
        </select>
      </div>
      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
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

export function AdminProductEditor() {
  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Продукт</span>
          <h1>Страница создания и редактирования позиции</h1>
        </div>
        <button type="button" className="button primary">Сохранить</button>
      </div>
      <div className="editorGrid">
        <div className="panel formGrid">
          <input type="text" defaultValue={products[0].name} placeholder="Название товара" />
          <input type="text" defaultValue={products[0].slug} placeholder="Slug" />
          <textarea rows={6} defaultValue={products[0].description} placeholder="Описание" />
          <div className="splitGrid">
            <input type="number" defaultValue={products[0].price} placeholder="Цена" />
            <input type="number" defaultValue={products[0].oldPrice ?? ""} placeholder="Старая цена" />
          </div>
          <div className="splitGrid">
            <input type="text" defaultValue={products[0].category} placeholder="Категория" />
            <input type="number" defaultValue={products[0].stock} placeholder="Остаток" />
          </div>
        </div>
        <div className="panel formGrid">
          <input type="text" defaultValue={products[0].material} placeholder="Материал" />
          <input type="text" defaultValue={products[0].color} placeholder="Цвет" />
          <input type="url" defaultValue={products[0].image} placeholder="URL изображения" />
          <textarea rows={8} defaultValue={products[0].features.join("\n")} placeholder="Характеристики" />
        </div>
      </div>
    </section>
  );
}

export function AdminNewsSection() {
  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Новости</span>
          <h1>Перечень всех новостей</h1>
        </div>
        <Link href="/admin/post/new" className="button primary">Создать пост</Link>
      </div>
      <div className="blogGrid">
        {posts.map((post) => (
          <article key={post.id} className="panel">
            <div className="metaLine">
              <span>{post.category}</span>
              <span>{post.date}</span>
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

export function AdminPostEditor() {
  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Пост</span>
          <h1>Страница создания новости со встроенным редактором</h1>
        </div>
        <button type="button" className="button primary">Опубликовать</button>
      </div>
      <div className="editorGrid singleColumn">
        <div className="panel formGrid">
          <input type="text" defaultValue={posts[0].title} placeholder="Заголовок" />
          <input type="text" defaultValue={posts[0].slug} placeholder="Slug" />
          <input type="text" defaultValue={posts[0].category} placeholder="Категория" />
        </div>
        <div className="panel">
          <div className="toolbarButtons">
            <button type="button">H2</button>
            <button type="button">Bold</button>
            <button type="button">List</button>
            <button type="button">Quote</button>
          </div>
          <div className="richEditor" contentEditable suppressContentEditableWarning>
            <h2>Редактор контента</h2>
            <p>Здесь можно подключить полноценный WYSIWYG или стартовать с простого встроенного редактора.</p>
            <p>{posts[0].content[0]}</p>
            <ul>
              <li>Заголовки</li>
              <li>Списки</li>
              <li>Базовое форматирование</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
