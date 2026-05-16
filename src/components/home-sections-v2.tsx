import { getLocale, getTranslations } from "next-intl/server";
import { Hero } from "@/components/hero";
import type { StoreProduct } from "@/components/storefront-db";
import { CatalogView } from "@/components/storefront-db";
import { Link } from "@/i18n/navigation";
import type { DbHeroSettings } from "@/lib/json-db";

export async function HomeSectionsV2({
  featuredProducts,
  seasons,
  heroSettings
}: {
  featuredProducts: StoreProduct[];
  seasons: string[];
  heroSettings: DbHeroSettings;
}) {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const heroProduct = featuredProducts[0];
  const localizedBenefits = heroSettings.benefitsI18n?.[locale] ?? heroSettings.benefits;

  return (
    <main>
      <Hero
        badge={(heroSettings.badgeI18n?.[locale] ?? heroSettings.badge) || t("badge")}
        title={(heroSettings.titleI18n?.[locale] ?? heroSettings.title) || t("title")}
        description={(heroSettings.descriptionI18n?.[locale] ?? heroSettings.description) || t("description")}
        primaryBtnText={(heroSettings.primaryTextI18n?.[locale] ?? heroSettings.primaryText) || t("primary")}
        primaryBtnLink={heroSettings.primaryLink || "/catalog"}
        secondaryBtnText={(heroSettings.secondaryTextI18n?.[locale] ?? heroSettings.secondaryText) || t("secondary")}
        secondaryBtnLink={heroSettings.secondaryLink || "/admin/products"}
        imageSrc={heroSettings.imageSrc || heroProduct?.image || "/images/product-placeholder.svg"}
        imageAlt={(heroSettings.imageAltI18n?.[locale] ?? heroSettings.imageAlt) || heroProduct?.name || t("imageAlt")}
        benefits={localizedBenefits.length > 0 ? localizedBenefits : [t("benefit1"), t("benefit2"), t("benefit3")]}
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
