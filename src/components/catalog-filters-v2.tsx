"use client";

import { useMemo, useState } from "react";
import { CatalogView, type StoreProduct } from "@/components/storefront-db";

export function CatalogFiltersV2({ products }: { products: StoreProduct[] }) {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [maxPrice, setMaxPrice] = useState(8000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [search, setSearch] = useState("");

  const categories = useMemo(() => ["Все", ...new Set(products.map((item) => item.category))], [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = activeCategory === "Все" || product.category === activeCategory;
      const stockMatch = !inStockOnly || product.stock > 0;
      const priceMatch = product.price <= maxPrice;
      const query = search.trim().toLowerCase();
      const searchMatch =
        !query ||
        [product.name, product.brand, product.category, product.audience, product.season]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return categoryMatch && stockMatch && priceMatch && searchMatch;
    });
  }, [activeCategory, inStockOnly, maxPrice, products, search]);

  return (
    <main className="page section container twoColumn">
      <aside className="panel stickySide">
        <h2>Фильтры</h2>
        <div className="filterBlock">
          <label htmlFor="catalogSearch">Поиск</label>
          <input
            id="catalogSearch"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Название, бренд, сезон..."
          />
        </div>
        <div className="filterBlock">
          <span>Категории</span>
          <div className="chips">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`chip ${category === activeCategory ? "active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="filterBlock">
          <label htmlFor="price">Максимальная цена: {maxPrice} грн</label>
          <input
            id="price"
            type="range"
            min="500"
            max="8000"
            step="100"
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
          />
          Только в наличии
        </label>
      </aside>

      <section>
        <div className="sectionHeading compact">
          <span className="eyebrow">Каталог</span>
          <h1>Товары с фильтрами</h1>
          <p>Поиск работает по названию, бренду, категории, сезону и назначению товара.</p>
        </div>
        <CatalogView products={filtered} />
      </section>
    </main>
  );
}
