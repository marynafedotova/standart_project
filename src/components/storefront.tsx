import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { categories, posts, products, type Product } from "../lib/data";

export function StoreHeader() {
  const links = [
    ["/", "Головна"],
    ["/catalog", "Каталог"],
    ["/blog", "Блог"],
    ["/contacts", "Контакти"],
    ["/favorites", "Обране"],
    ["/cart", "Кошик"],
    ["/admin/products", "Адмінка"]
  ];

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        Standard Shop
      </Link>
      <nav className="nav">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="footer">
      <div>
        <strong>Standard Shop</strong>
        <p>Готовий шаблон магазину для будь-якого товару або бренду.</p>
      </div>
      <div className="footerLinks">
        <Link href="/privacy">Політика конфіденційності</Link>
        <Link href="/offer">Публічна оферта</Link>
      </div>
    </footer>
  );
}

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <StoreHeader />
      {children}
      <StoreFooter />
    </div>
  );
}

export function HomeSections() {
  return (
    <main>
      <section className="hero page">
        <div className="heroCopy">
          <span className="eyebrow">Reusable E-commerce Template</span>
          <h1>Стандартный шаблон интернет-магазина на React и Next.js.</h1>
          <p>
            Уже включены витрина, каталог с фильтрами, карточка товара, блог,
            контакты, юридические страницы, корзина, избранное и админка.
          </p>
          <div className="actions">
            <Link href="/catalog" className="button primary">
              Открыть каталог
            </Link>
            <Link href="/admin/products" className="button secondary">
              Открыть админку
            </Link>
          </div>
        </div>
        <div className="heroCard">
          <Image src={products[0].image} alt={products[0].name} fill className="cover" />
          <div className="floatingCard">
            <strong>+24%</strong>
            <span>рост конверсии за счет продуманной структуры витрины</span>
          </div>
        </div>
      </section>

      <section className="page section container">
        <div className="sectionHeading">
          <span className="eyebrow">Что есть в шаблоне</span>
          <h2>База, которую легко адаптировать под любую товарную нишу</h2>
        </div>
        <div className="featureGrid">
          <article className="panel">
            <h3>Гибкая витрина</h3>
            <p>Меняйте hero, категории, карточки и акценты под свой продукт без переделки архитектуры.</p>
          </article>
          <article className="panel">
            <h3>Каталог с фильтрами</h3>
            <p>Логика уже готова для цены, категорий, наличия и может расширяться под любые свойства.</p>
          </article>
          <article className="panel">
            <h3>Контент и админка</h3>
            <p>Товары и новости разделены, чтобы удобно вести каталог и блог бренда из одной панели.</p>
          </article>
        </div>
      </section>

      <section className="page section container">
        <div className="sectionHeading">
          <span className="eyebrow">Популярное</span>
          <h2>Рекомендованные товары</h2>
        </div>
        <div className="productGrid">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

export function CatalogSections() {
  return (
    <main className="page section container twoColumn">
      <aside className="panel stickySide">
        <h2>Фильтры</h2>
        <div className="filterBlock">
          <span>Категории</span>
          <div className="chips">
            {categories.map((category) => (
              <button key={category} type="button" className={`chip ${category === "Усі" ? "active" : ""}`}>
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="filterBlock">
          <label htmlFor="price">Максимальная цена: 8000 грн</label>
          <input id="price" type="range" min="500" max="8000" defaultValue="8000" />
        </div>
        <label className="checkbox">
          <input type="checkbox" />
          Только в наличии
        </label>
      </aside>

      <section>
        <div className="sectionHeading compact">
          <span className="eyebrow">Каталог</span>
          <h1>Товары с фильтрами</h1>
          <p>Фильтры можно быстро заменить на бренд, размер, вкус, материал, объем или другие свойства.</p>
        </div>
        <div className="productGrid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

export function ProductDetails({ product }: { product: Product }) {
  return (
    <main className="page section container productPage">
      <div className="imageCard">
        <Image src={product.image} alt={product.name} width={900} height={900} className="contentImage" />
      </div>
      <div className="panel detailsCard">
        <span className="eyebrow">{product.category}</span>
        <h1>{product.name}</h1>
        <div className="priceLine">
          <strong>{product.price} грн</strong>
          {product.oldPrice ? <span>{product.oldPrice} грн</span> : null}
        </div>
        <p>{product.description}</p>
        <div className="specGrid">
          <div>
            <span>Материал</span>
            <strong>{product.material}</strong>
          </div>
          <div>
            <span>Цвет</span>
            <strong>{product.color}</strong>
          </div>
          <div>
            <span>Остаток</span>
            <strong>{product.stock}</strong>
          </div>
        </div>
        <ul className="bulletList">
          {product.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <div className="actions">
          <button type="button" className="button primary">
            В корзину
          </button>
          <button type="button" className="button secondary">
            В избранное
          </button>
        </div>
      </div>
    </main>
  );
}

export function BlogSections() {
  return (
    <main className="page section container">
      <div className="sectionHeading compact">
        <span className="eyebrow">Блог</span>
        <h1>Новости и статьи магазина</h1>
      </div>
      <div className="blogGrid">
        {posts.map((post) => (
          <article key={post.id} className="panel articleCard">
            <Image src={post.cover} alt={post.title} width={1000} height={700} className="cardImage" />
            <div className="metaLine">
              <span>{post.category}</span>
              <span>{post.date}</span>
            </div>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <Link href={`/blog#${post.slug}`}>Читать</Link>
          </article>
        ))}
      </div>
    </main>
  );
}

export function ContactsSections() {
  return (
    <main className="page section container twoColumn">
      <section className="panel">
        <span className="eyebrow">Контакты</span>
        <h1>Связь с магазином</h1>
        <p>Здесь можно разместить телефон, email, адрес, карту, мессенджеры и форму обратной связи.</p>
        <div className="contactGrid">
          <div><span>Email</span><strong>hello@standardshop.ua</strong></div>
          <div><span>Телефон</span><strong>+380 67 000 00 00</strong></div>
          <div><span>Адрес</span><strong>Киев, ул. Примерная, 21</strong></div>
        </div>
      </section>
      <section className="panel formGrid">
        <h2>Напишите нам</h2>
        <input type="text" placeholder="Ваше имя" />
        <input type="email" placeholder="Email" />
        <textarea rows={6} placeholder="Сообщение" />
        <button type="button" className="button primary">Отправить</button>
      </section>
    </main>
  );
}

export function LegalSections({ title }: { title: string }) {
  return (
    <main className="page section container narrow">
      <span className="eyebrow">Юридическая страница</span>
      <h1>{title}</h1>
      <div className="legalBlock">
        <p>Это шаблонный маршрут для размещения текста политики конфиденциальности, условий оплаты, доставки и возврата.</p>
        <p>Достаточно заменить демо-текст на ваш юридически согласованный контент, не меняя структуру приложения.</p>
      </div>
    </main>
  );
}

export function CartSections() {
  return (
    <main className="page section container twoColumn">
      <section className="panel">
        <h1>Корзина</h1>
        {products.slice(0, 2).map((product) => (
          <div key={product.id} className="cartItem">
            <Image src={product.image} alt={product.name} width={96} height={96} className="miniThumb" />
            <div>
              <strong>{product.name}</strong>
              <p>{product.price} грн</p>
            </div>
            <span>x1</span>
          </div>
        ))}
      </section>
      <aside className="panel">
        <h2>Итого</h2>
        <div className="metaLine">
          <span>2 товара</span>
          <strong>5680 грн</strong>
        </div>
        <button type="button" className="button primary full">Оформить заказ</button>
      </aside>
    </main>
  );
}

export function FavoritesSections() {
  return (
    <main className="page section container">
      <div className="sectionHeading compact">
        <span className="eyebrow">Избранное</span>
        <h1>Сохраненные товары</h1>
      </div>
      <div className="productGrid">
        {products.slice(1, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="productCard">
      <Image src={product.image} alt={product.name} width={800} height={600} className="cardImage" />
      <div className="cardBody">
        <div className="metaLine">
          <span>{product.category}</span>
          <span>{product.badge ?? "In stock"}</span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="metaLine">
          <strong>{product.price} грн</strong>
          <Link href={`/product/${product.slug}`}>Подробнее</Link>
        </div>
      </div>
    </article>
  );
}
