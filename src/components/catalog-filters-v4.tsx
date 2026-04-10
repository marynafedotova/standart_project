"use client";

import { useMemo, useState } from "react";
import { CatalogView, type StoreProduct } from "@/components/storefront-db-v2";
import { parseMultiValue } from "@/lib/multi-value";

type FilterGroupProps = {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
};

function getUniqueValues(products: StoreProduct[], pick: (product: StoreProduct) => string | string[]) {
  return [...new Set(products.flatMap((product) => pick(product)).map((value) => value.trim()).filter(Boolean))];
}

function matchesSelected(value: string | string[], selected: string[]) {
  const parsed = parseMultiValue(value);
  return selected.length === 0 || parsed.some((item) => selected.includes(item));
}

function FilterGroup({ title, values, selected, onToggle }: FilterGroupProps) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="filterBlock">
      <span>{title}</span>
      <div className="chips">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            className={`chip ${selected.includes(value) ? "active" : ""}`}
            onClick={() => onToggle(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CatalogFiltersV4({
  products,
  initialSeason = ""
}: {
  products: StoreProduct[];
  initialSeason?: string;
}) {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(8000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCentimeters, setSelectedCentimeters] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(
    initialSeason.trim() ? [initialSeason.trim()] : []
  );
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const categories = useMemo(() => getUniqueValues(products, (product) => parseMultiValue(product.category)), [products]);
  const brands = useMemo(() => getUniqueValues(products, (product) => product.brand), [products]);
  const sizes = useMemo(() => getUniqueValues(products, (product) => product.size), [products]);
  const centimeters = useMemo(() => getUniqueValues(products, (product) => product.centimeters), [products]);
  const ageGroups = useMemo(() => getUniqueValues(products, (product) => product.ageGroup), [products]);
  const audiences = useMemo(() => getUniqueValues(products, (product) => product.audience), [products]);
  const seasons = useMemo(() => getUniqueValues(products, (product) => parseMultiValue(product.season)), [products]);
  const materials = useMemo(() => getUniqueValues(products, (product) => product.material), [products]);
  const colors = useMemo(() => getUniqueValues(products, (product) => product.colors), [products]);

  function toggleValue(value: string, current: string[], setter: (value: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const categoryValues = parseMultiValue(product.category);
      const seasonValues = parseMultiValue(product.season);
      const categoryMatch = matchesSelected(categoryValues, selectedCategories);
      const brandMatch = matchesSelected(product.brand, selectedBrands);
      const sizeMatch = matchesSelected(product.size, selectedSizes);
      const centimetersMatch = matchesSelected(product.centimeters, selectedCentimeters);
      const ageGroupMatch = matchesSelected(product.ageGroup, selectedAgeGroups);
      const audienceMatch = matchesSelected(product.audience, selectedAudiences);
      const seasonMatch = matchesSelected(seasonValues, selectedSeasons);
      const materialMatch = matchesSelected(product.material, selectedMaterials);
      const colorMatch =
        selectedColors.length === 0 || product.colors.some((color) => selectedColors.includes(color));
      const stockMatch = !inStockOnly || product.stock > 0;
      const priceMatch = product.price <= maxPrice;
      const searchMatch =
        !query ||
        [
          product.name,
          product.description,
          ...categoryValues,
          product.brand,
          product.size,
          product.centimeters,
          product.ageGroup,
          product.audience,
          ...seasonValues,
          product.material,
          ...product.colors,
          ...product.features
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return (
        categoryMatch &&
        brandMatch &&
        sizeMatch &&
        centimetersMatch &&
        ageGroupMatch &&
        audienceMatch &&
        seasonMatch &&
        materialMatch &&
        colorMatch &&
        stockMatch &&
        priceMatch &&
        searchMatch
      );
    });
  }, [
    inStockOnly,
    maxPrice,
    products,
    search,
    selectedAgeGroups,
    selectedAudiences,
    selectedBrands,
    selectedCategories,
    selectedCentimeters,
    selectedColors,
    selectedMaterials,
    selectedSeasons,
    selectedSizes
  ]);

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
            placeholder="Название, бренд, сезон, цвет..."
          />
        </div>

        <FilterGroup
          title="Категория"
          values={categories}
          selected={selectedCategories}
          onToggle={(value) => toggleValue(value, selectedCategories, setSelectedCategories)}
        />
        <FilterGroup
          title="Бренд"
          values={brands}
          selected={selectedBrands}
          onToggle={(value) => toggleValue(value, selectedBrands, setSelectedBrands)}
        />
        <FilterGroup
          title="Размер"
          values={sizes}
          selected={selectedSizes}
          onToggle={(value) => toggleValue(value, selectedSizes, setSelectedSizes)}
        />
        <FilterGroup
          title="Сантиметры"
          values={centimeters}
          selected={selectedCentimeters}
          onToggle={(value) => toggleValue(value, selectedCentimeters, setSelectedCentimeters)}
        />
        <FilterGroup
          title="Возраст"
          values={ageGroups}
          selected={selectedAgeGroups}
          onToggle={(value) => toggleValue(value, selectedAgeGroups, setSelectedAgeGroups)}
        />
        <FilterGroup
          title="Для кого подходит"
          values={audiences}
          selected={selectedAudiences}
          onToggle={(value) => toggleValue(value, selectedAudiences, setSelectedAudiences)}
        />
        <FilterGroup
          title="Сезон"
          values={seasons}
          selected={selectedSeasons}
          onToggle={(value) => toggleValue(value, selectedSeasons, setSelectedSeasons)}
        />
        <FilterGroup
          title="Материал"
          values={materials}
          selected={selectedMaterials}
          onToggle={(value) => toggleValue(value, selectedMaterials, setSelectedMaterials)}
        />
        <FilterGroup
          title="Цвет"
          values={colors}
          selected={selectedColors}
          onToggle={(value) => toggleValue(value, selectedColors, setSelectedColors)}
        />

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
          <h1>Товары с расширенными фильтрами</h1>
          <p>Клиент может искать и отбирать товары по всем основным характеристикам карточки товара.</p>
        </div>
        <CatalogView products={filtered} />
      </section>
    </main>
  );
}
