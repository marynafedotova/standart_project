import Image from "next/image";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { DbPostBlock } from "@/lib/json-db";
import { Link } from "@/i18n/navigation";
import { PostContent } from "@/components/post-content";
import { ProductGallery } from "@/components/product-gallery";
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
  nameI18n?: Record<string, string>;
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
  descriptionI18n?: Record<string, string>;
  image: string;
  images: string[];
  features: string[];
};

export type StorePost = {
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
  createdAt: Date;
};

function localizeText(value: string, translations: Record<string, string> | undefined, locale: string) {
  return translations?.[locale] || value;
}
export async function StoreShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Shell");
  const locale = await getLocale();
  const links = [
    ["/", t("home")],
    ["/catalog", t("catalog")],
    ["/blog", t("blog")],
    ["/contacts", t("contacts")],
    ["/favorites", t("favorites")],
    ["/cart", t("cart")]
  ] as const;
  const socialLinks = [
    ["https://instagram.com/", "Instagram"],
    ["https://t.me/", "Telegram"],
    ["viber://chat?number=%2B380670000000", "Viber"],
    ["https://wa.me/380670000000", "WhatsApp"]
  ] as const;
  const localeLabels = {
    uk: "УКР",
    ru: "РУС",
    en: "ENG"
  } as const;

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          {t("brand")}
        </Link>
        <nav className="nav shellNav">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="localeSwitch" aria-label="Language switcher">
          {(["uk", "ru", "en"] as const).map((item) => (
            <Link
              key={item}
              href="/"
              locale={item}
              className={item === locale ? "active" : ""}
            >
              {localeLabels[item]}
            </Link>
          ))}
        </div>
      </header>
      {children}
      <footer className="footer">
        <div>
          <strong>{t("brand")}</strong>
          <p>{t("footerText")}</p>
        </div>
        <div className="footerLinks socialLinks">
          {socialLinks.map(([href, label]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
        </div>
        <div className="footerLinks">
          <Link href="/privacy">{t("privacy")}</Link>
          <Link href="/offer">{t("offer")}</Link>
        </div>
      </footer>
    </div>
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

export async function ProductDetails({ product }: { product: StoreProduct }) {
  const t = await getTranslations("Product");
  const locale = await getLocale();
  const galleryImages = product.images.length > 0 ? product.images : [product.image];
  const productName = localizeText(product.name, product.nameI18n, locale);
  const productDescription = localizeText(product.description, product.descriptionI18n, locale);

  return (
    <main className="page section container productPage">
      <ProductGallery images={galleryImages} name={product.name} />

      <div className="panel detailsCard">
        <span className="eyebrow">{product.category}</span>
        <h1>{productName}</h1>

        <div className="priceLine">
          <strong>{formatMoney(product.price)}</strong>
          {product.oldPrice ? <span>{formatMoney(product.oldPrice)}</span> : null}
        </div>

        <p>{productDescription}</p>

        <div className="specGrid">
          <div>
            <span>{t("brand")}</span>
            <strong>{product.brand || t("empty")}</strong>
          </div>
          <div>
            <span>{t("material")}</span>
            <strong>{product.material || t("empty")}</strong>
          </div>
          <div>
            <span>{t("color")}</span>
            <strong>{product.colors.join(", ") || t("empty")}</strong>
          </div>
          <div>
            <span>{t("size")}</span>
            <strong>{product.size || t("empty")}</strong>
          </div>
          <div>
            <span>{t("centimeters")}</span>
            <strong>{product.centimeters || t("empty")}</strong>
          </div>
          <div>
            <span>{t("age")}</span>
            <strong>{product.ageGroup || t("empty")}</strong>
          </div>
          <div>
            <span>{t("audience")}</span>
            <strong>{product.audience || t("empty")}</strong>
          </div>
          <div>
            <span>{t("season")}</span>
            <strong>{product.season || t("empty")}</strong>
          </div>
        </div>

        {product.features.length > 0 ? (
          <ul className="bulletList">
            {product.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        ) : null}

        <ProductDetailActions product={product} />
      </div>
    </main>
  );
}

export async function BlogSections({ posts }: { posts: StorePost[] }) {
  const t = await getTranslations("Blog");
  const locale = await getLocale();

  return (
    <main className="page section container">
      <div className="sectionHeading compact">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1>{t("title")}</h1>
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
            <p>{localizeText(post.excerpt, post.excerptI18n, locale)}</p>
            <Link href={`/blog/${post.slug}`} className="button secondary">
              {t("readMore")}
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

export async function BlogPostDetails({ post }: { post: StorePost }) {
  const t = await getTranslations("Blog");
  const locale = await getLocale();
  const blocks =
    post.contentBlocks && post.contentBlocks.length > 0
      ? post.contentBlocks
      : post.content.map((paragraph, index) => ({
          id: `${post.id}-${index}`,
          type: "paragraph" as const,
          text: paragraph,
          align: "left" as const
        }));

  return (
    <main className="page section container narrow">
      <article className="panel articleDetail">
        <div className="metaLine">
          <span>{post.category}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <h1>{localizeText(post.title, post.titleI18n, locale)}</h1>
        <Image src={post.cover} alt={post.title} width={1200} height={800} className="cardImage" />
        <p>{localizeText(post.excerpt, post.excerptI18n, locale)}</p>
        <PostContent blocks={blocks} />
        <Link href="/blog" className="button secondary">
          {t("back")}
        </Link>
      </article>
    </main>
  );
}

export async function ContactsSections() {
  const t = await getTranslations("Contacts");

  return (
    <main className="page section container twoColumn">
      <section className="panel">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="contacts-title">{t("title")}</h1>
        <p>{t("description")}</p>
        <div className="contactGrid">
          <div>
            <span>Email:</span>
            <strong>
              <a href="mailto:hello@standardshop.ua">hello@standardshop.ua</a>
            </strong>
          </div>
          <div>
            <span>{t("phone")}</span>
            <strong>
              <a href="tel:+380670000000">+380 67 000 00 00</a>
            </strong>
          </div>
          <div>
            <span>{t("address")}</span>
            <strong>
              <a href="https://maps.google.com/?q=Киев, ул. Примерная, 21" target="_blank" rel="noopener noreferrer">
                Киев, ул. Примерная, 21
              </a>
            </strong>
          </div>
        </div>
      </section>

      <section className="panel formGrid">
        <h2>{t("formTitle")}</h2>
        <input type="text" placeholder={t("name")} />
        <input type="email" placeholder={t("email")} />
        <textarea rows={6} placeholder={t("message")} />
        <button type="button" className="button primary">
          {t("submit")}
        </button>
      </section>
    </main>
  );
}

export async function LegalSections({ titleKey }: { titleKey: "Shell.privacy" | "Shell.offer" }) {
  const t = await getTranslations();

  return (
    <main className="page section container narrow">
      <span className="eyebrow">{t("Legal.eyebrow")}</span>
      <h1>{t(titleKey)}</h1>
      <div className="legalBlock">
        <p>{t("Legal.description1")}</p>
        <p>{t("Legal.description2")}</p>
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
  const primaryImage = product.images[0] || product.image;

  return (
    <article className="productCard">
      <Image src={primaryImage} alt={product.name} width={800} height={600} className="cardImage" />
      <div className="cardBody">
        <div className="metaLine">
          <span>{product.category}</span>
          <span>{product.badge ?? "В наличии"}</span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="metaLine">
          <strong>{formatMoney(product.price)}</strong>
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

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value)} грн`;
}

