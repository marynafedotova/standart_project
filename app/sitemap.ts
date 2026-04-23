import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/routing";
import { getPosts, getProducts } from "@/lib/store";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function withLocale(locale: string, path = "") {
  return `/${locale}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);
  const staticPaths = ["", "/catalog", "/blog", "/contacts", "/favorites", "/cart", "/privacy", "/offer"];

  const localizedStatics: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${baseUrl}${withLocale(locale, path)}`,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" && locale === defaultLocale ? 1 : 0.7
    }))
  );

  const localizedProducts: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    products.map((product) => ({
      url: `${baseUrl}${withLocale(locale, `/product/${product.slug}`)}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  );

  const localizedPosts: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    posts.map((post) => ({
      url: `${baseUrl}${withLocale(locale, `/blog/${post.slug}`)}`,
      lastModified: post.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.6
    }))
  );

  return [...localizedStatics, ...localizedProducts, ...localizedPosts];
}
