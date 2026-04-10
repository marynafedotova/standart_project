import Link from "next/link";
import { Hero } from "@/components/hero";
import type { StoreProduct } from "@/components/storefront-db-v2";
import { CatalogView } from "@/components/storefront-db-v2";

export function HomeSectionsV2({
  featuredProducts,
  seasons
}: {
  featuredProducts: StoreProduct[];
  seasons: string[];
}) {
  const heroProduct = featuredProducts[0];

  return (
    <main>
      <Hero
        badge="Готовый шаблон магазина"
        title="Витрина для товаров, брендов и сезонных коллекций"
        description="Используйте этот шаблон как основу для интернет-магазина с каталогом, блогом, заказами и админкой. Наполнение и акценты легко адаптируются под любую нишу."
        primaryBtnText="Открыть каталог"
        primaryBtnLink="/catalog"
        secondaryBtnText="Перейти в админку"
        secondaryBtnLink="/admin/products"
        imageSrc={heroProduct?.image ?? "/images/product-placeholder.svg"}
        imageAlt={heroProduct?.name ?? "Главный визуал магазина"}
        benefits={["Быстрый запуск", "Управление товарами", "Готовые страницы"]}
      />

      {seasons.length > 0 ? (
        <section className="page section container">
          <div className="sectionHeading">
            <span className="eyebrow">Сезоны</span>
            <h2>Подборки по сезонам</h2>
            <p>Выберите сезон, чтобы сразу открыть каталог с уже активным фильтром.</p>
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
        <CatalogView products={featuredProducts} />
      </section>
    </main>
  );
}
