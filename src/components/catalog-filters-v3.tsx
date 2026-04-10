"use client";

import { useMemo, useState } from "react";
import { CatalogView, type StoreProduct } from "@/components/storefront-db";

export function CatalogFiltersV3({ products }: { products: StoreProduct[] }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(8000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [search, setSearch] = useState("");

  const categories = useMemo(() => [...new Set(products.map((item) => item.category))], [products]);
  const colors = useMemo(
    () => [...new Set(products.flatMap((item) => item.colors).filter(Boolean))],
    [products]
  );

  function toggleValue(value: string, current: string[], setValue: (items: string[]) => void) {
    setValue(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const colorMatch =
        selectedColors.length === 0 || product.colors.some((color) => selectedColors.includes(color));
      const stockMatch = !inStockOnly || product.stock > 0;
      const priceMatch = product.price <= maxPrice;
      const query = search.trim().toLowerCase();
      const searchMatch =
        !query ||
        [product.name, product.brand, product.category, product.audience, product.season, ...product.colors]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return categoryMatch && colorMatch && stockMatch && priceMatch && searchMatch;
    });
  }, [inStockOnly, maxPrice, products, search, selectedCategories, selectedColors]);

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
                className={`chip ${selectedCategories.includes(category) ? "active" : ""}`}
                onClick={() => toggleValue(category, selectedCategories, setSelectedCategories)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="filterBlock">
          <span>Цвета</span>
          <div className="chips">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className={`chip ${selectedColors.includes(color) ? "active" : ""}`}
                onClick={() => toggleValue(color, selectedColors, setSelectedColors)}
              >
                {color}
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
          <p>Поиск и фильтры теперь поддерживают множественный выбор категорий и цветов.</p>
        </div>
        <CatalogView products={filtered} />
      </section>
    </main>
  );
}
