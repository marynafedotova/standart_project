import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/hero";
import type { StoreProduct } from "@/components/storefront-db-v2";
import { CatalogView } from "@/components/storefront-db-v2";
import { Link } from "@/i18n/navigation";

export async function HomeSectionsV2({
  featuredProducts,
  seasons
}: {
  featuredProducts: StoreProduct[];
  seasons: string[];
}) {
  const t = await getTranslations("Home");
  const heroProduct = featuredProducts[0];

  return (
    <main>
      <Hero
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
        primaryBtnText={t("primary")}
        primaryBtnLink="/catalog"
        secondaryBtnText={t("secondary")}
        secondaryBtnLink="/admin/products"
        imageSrc={heroProduct?.image ?? "/images/product-placeholder.svg"}
        imageAlt={heroProduct?.name ?? t("imageAlt")}
        benefits={[t("benefit1"), t("benefit2"), t("benefit3")]}
      />

      {seasons.length > 0 ? (
        <section className="page section container">
          <div className="sectionHeading">
            <span className="eyebrow">{t("seasonsEyebrow")}</span>
            <h2>{t("seasonsTitle")}</h2>
            <p>{t("seasonsText")}</p>
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
          <span className="eyebrow">{t("popularEyebrow")}</span>
          <h2>{t("popularTitle")}</h2>
        </div>
        <CatalogView products={featuredProducts} />
      </section>

      <section className="page section container">
        <div className="sectionHeading">
          <span className="eyebrow">{t("featuresEyebrow")}</span>
          <h2>{t("featuresTitle")}</h2>
        </div>
        <div className="featureGrid">
          <article className="panel">
            <h3>{t("feature1Title")}</h3>
            <p>{t("feature1Text")}</p>
          </article>
          <article className="panel">
            <h3>{t("feature2Title")}</h3>
            <p>{t("feature2Text")}</p>
          </article>
          <article className="panel">
            <h3>{t("feature3Title")}</h3>
            <p>{t("feature3Text")}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
