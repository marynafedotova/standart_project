import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CartClientView,
  FavoritesClientView,
  ProductCardActions,
  ProductDetailActions
} from "@/components/storefront-actions-v2";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
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

export type StorePost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover: string;
  content: string[];
  createdAt: Date;
};

export function StoreShell({ children }: { children: ReactNode }) {
  const links = [
    ["/", "Главная"],
    ["/catalog", "Каталог"],
    ["/blog", "Блог"],
    ["/contacts", "Контакты"],
    ["/favorites", "Избранное"],
    ["/cart", "Корзина"]
    // ["/admin/products", "Админка"]
  ];

  return (
    <div className="shell">
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
      {children}
      <footer className="footer">
        <div>
          <strong>Standard Shop</strong>
          <p>Готовый шаблон магазина для любого товара или бренда.</p>
        </div>
        <div className="footerLinks">
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/offer">Публичная оферта</Link>
        </div>
      </footer>
    </div>
  );
}

export function HomeSections({
  featuredProducts,
  seasons
}: {
  featuredProducts: StoreProduct[];
  seasons: string[];
}) {
  const heroProduct = featuredProducts[0];

  return (
    <main>
      <section className="hero page">
        <div className="heroCopy">
          <span className="eyebrow">Reusable E-commerce Template</span>
          <h1>Стандартный шаблон интернет-магазина на React и Next.js.</h1>
          <p>
            Витрина и админка работают с реальной базой данных, API-маршрутами и
            авторизацией администратора.
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
          {heroProduct ? (
            <>
              <Image src={heroProduct.image} alt={heroProduct.name} fill className="cover" />
              <div className="floatingCard">
                <strong>{heroProduct.price} грн</strong>
                <span>{heroProduct.name}</span>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="page section container">
        <div className="sectionHeading">
          <span className="eyebrow">Что есть в шаблоне</span>
          <h2>Основа, которую легко адаптировать под любую товарную нишу</h2>
        </div>
        <div className="featureGrid">
          <article className="panel">
            <h3>Реальная база данных</h3>
            <p>Товары и посты сохраняются и читаются из общего хранилища, а не из моков.</p>
          </article>
          <article className="panel">
            <h3>API для CRUD</h3>
            <p>Есть маршруты для создания, чтения, обновления и удаления товаров и новостей.</p>
          </article>
          <article className="panel">
            <h3>Защищенная админка</h3>
            <p>Сохранение и редактирование доступны только после входа по логину и паролю.</p>
          </article>
        </div>
      </section>

      {seasons.length > 0 ? (
        <section className="page section container">
          <div className="sectionHeading">
            <span className="eyebrow">Сезоны</span>
            <h2>Подборки по сезонам</h2>
            <p>Выберите сезон, чтобы сразу открыть каталог с уже включенным фильтром.</p>
          </div>
          <div className="seasonChips">
            {seasons.map((season) => (
              <Link
                key={season}
                href={`/catalog?season=${encodeURIComponent(season)}`}
                className="chip seasonChip"
              >
                {season}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="page section container">
        <div className="sectionHeading">
          <span className="eyebrow">Популярное</span>
          <h2>Рекомендуемые товары</h2>
        </div>
        <div className="productGrid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
export function CatalogView({ products }: { products: StoreProduct[] }) {
  return (
    <div className="productGrid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductDetails({ product }: { product: StoreProduct }) {
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
            <span>Бренд</span>
            <strong>{product.brand}</strong>
          </div>
          <div>
            <span>Материал</span>
            <strong>{product.material}</strong>
          </div>
          <div>
            <span>Цвет</span>
            <strong>{product.colors.join(", ") || "Не указаны"}</strong>
          </div>
          <div>
            <span>Размер</span>
            <strong>{product.size}</strong>
          </div>
          <div>
            <span>Сантиметры</span>
            <strong>{product.centimeters}</strong>
          </div>
          <div>
            <span>Возраст</span>
            <strong>{product.ageGroup}</strong>
          </div>
          <div>
            <span>Для кого</span>
            <strong>{product.audience}</strong>
          </div>
          <div>
            <span>Сезон</span>
            <strong>{product.season}</strong>
          </div>
        </div>
        <ul className="bulletList">
          {product.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <ProductDetailActions product={product} />
      </div>
    </main>
  );
}

export function BlogSections({ posts }: { posts: StorePost[] }) {
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
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            {post.content.slice(0, 2).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Link href={`/blog/${post.slug}`} className="button secondary">
              Подробнее
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}


export function BlogPostDetails({ post }: { post: StorePost }) {
  return (
    <main className="page section container narrow">
      <article className="panel articleDetail">
        <div className="metaLine">
          <span>{post.category}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <h1>{post.title}</h1>
        <Image src={post.cover} alt={post.title} width={1200} height={800} className="cardImage" />
        <p>{post.excerpt}</p>
        {post.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <Link href="/blog" className="button secondary">
          Блог
        </Link>
      </article>
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

export function CartSections({ products }: { products: StoreProduct[] }) {
  return <CartClientView products={products} />;
}

export function FavoritesSections({ products }: { products: StoreProduct[] }) {
  return <FavoritesClientView products={products} />;
}

function ProductCard({ product }: { product: StoreProduct }) {
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
          <strong>{product.price} РіСЂРЅ</strong>
          <Link href={`/product/${product.slug}`}>Подробнее</Link>
        </div>
        <ProductCardActions product={product} />
      </div>
    </article>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}
