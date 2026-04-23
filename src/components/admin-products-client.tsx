"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminProduct } from "@/components/admin-ui";
import { useSelectableExport } from "@/components/export-actions";

const PRODUCT_STATUSES = ["Активен", "Черновик", "Нет в наличии", "Брак"] as const;

type ProductStatus = (typeof PRODUCT_STATUSES)[number];

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value)} грн`;
}

export function AdminProductsClient({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [skuQuery, setSkuQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [rows, setRows] = useState<Record<string, ProductStatus>>(() =>
    Object.fromEntries(
      products.map((product) => [
        product.id,
        (product.status as ProductStatus) || (product.stock > 0 ? "Активен" : "Нет в наличии")
      ])
    )
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const exportUi = useSelectableExport(
    products.map((product) => product.id),
    "products"
  );

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const sizes = useMemo(
    () => [...new Set(products.map((product) => product.size).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSku = skuQuery.trim().toLowerCase();
    const parsedMinPrice = minPrice.trim() ? Number(minPrice.replace(",", ".")) : null;
    const parsedMaxPrice = maxPrice.trim() ? Number(maxPrice.replace(",", ".")) : null;

    return products.filter((product) => {
      const status = rows[product.id] ?? ((product.status as ProductStatus) || (product.stock > 0 ? "Активен" : "Нет в наличии"));
      const matchesSku =
        !normalizedSku ||
        product.sku.toLowerCase().includes(normalizedSku) ||
        product.name.toLowerCase().includes(normalizedSku);
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand;
      const matchesStatus = selectedStatus === "all" || status === selectedStatus;
      const matchesSize = selectedSize === "all" || product.size === selectedSize;
      const matchesMinPrice = parsedMinPrice === null || Number.isNaN(parsedMinPrice) || product.price >= parsedMinPrice;
      const matchesMaxPrice = parsedMaxPrice === null || Number.isNaN(parsedMaxPrice) || product.price <= parsedMaxPrice;

      return (
        matchesSku &&
        matchesCategory &&
        matchesBrand &&
        matchesStatus &&
        matchesSize &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });
  }, [maxPrice, minPrice, products, rows, selectedBrand, selectedCategory, selectedSize, selectedStatus, skuQuery]);

  async function saveProduct(product: AdminProduct) {
    const status = rows[product.id];
    if (!status) return;

    setSavingId(product.id);

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...product,
        status
      })
    });

    if (response.ok) {
      const saved = await response.json();
      setRows((current) => ({
        ...current,
        [product.id]: saved.status
      }));
    }

    setSavingId(null);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage("");
    setImportError("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/import/products", {
      method: "POST",
      body: formData
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const details = Array.isArray(data?.errors) ? ` ${data.errors.join(" | ")}` : "";
      setImportError((typeof data?.error === "string" ? data.error : "Не вдалося імпортувати товари.") + details);
      setImporting(false);
      event.target.value = "";
      return;
    }

    setImportMessage(`Імпорт завершено: створено ${data?.created ?? 0}, оновлено ${data?.updated ?? 0}.`);
    setImporting(false);
    event.target.value = "";
    router.refresh();
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Товары</span>
          <h1>Список товаров</h1>
        </div>
        <div className="actions">
          <Link href="/admin/product/new" className="button primary">Создать товар</Link>
          <a href="/api/import/products" className="button secondary">Шаблон Excel</a>
          <label className="button secondary">
            {importing ? "Импорт..." : "Импорт Excel"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="visuallyHidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>
          <a href={exportUi.allHref} className="button secondary">Excel: все</a>
          <a
            href={exportUi.hasSelection ? exportUi.selectedHref : undefined}
            className="button secondary"
            aria-disabled={!exportUi.hasSelection}
          >
            Excel: выбранные
          </a>
        </div>
      </div>
      <div className="panel toolbar">
        <label className="checkbox">
          <input type="checkbox" checked={exportUi.allSelected} onChange={() => exportUi.toggleAll()} />
          <span>Выбрать все</span>
        </label>
        {exportUi.hasSelection ? <span>{exportUi.selectedIds.length} выбрано</span> : <span>Можно отметить несколько строк</span>}
        {importMessage ? <span className="successText">{importMessage}</span> : null}
        {importError ? <span className="errorText">{importError}</span> : null}
      </div>
      <div className="panel toolbar">
        <input
          type="search"
          value={skuQuery}
          onChange={(event) => setSkuQuery(event.target.value)}
          placeholder="Поиск по артикулу или названию"
        />
        <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
          <option value="all">Все категории</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}>
          <option value="all">Все бренды</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
          <option value="all">Все статусы</option>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
          <option value="all">Все размеры</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="decimal"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="Цена от"
        />
        <input
          type="text"
          inputMode="decimal"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="Цена до"
        />
      </div>
      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Артикул</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Размер</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const status = rows[product.id] ?? ((product.status as ProductStatus) || (product.stock > 0 ? "Активен" : "Нет в наличии"));

              return (
                <tr key={product.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={exportUi.selectedIds.includes(product.id)}
                      onChange={() => exportUi.toggleOne(product.id)}
                      aria-label={`Выбрать товар ${product.name}`}
                    />
                  </td>
                  <td>{product.sku}</td>
                  <td><Link href={`/admin/product/${product.id}`}>{product.name}</Link></td>
                  <td>{product.category}</td>
                  <td>{product.size || "—"}</td>
                  <td>{formatMoney(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <select
                      value={status}
                      onChange={(event) =>
                        setRows((current) => ({
                          ...current,
                          [product.id]: event.target.value as ProductStatus
                        }))
                      }
                    >
                      {PRODUCT_STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => saveProduct(product)}
                      disabled={savingId === product.id}
                    >
                      {savingId === product.id ? "Сохранение..." : "Сохранить"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 ? <p>По текущим фильтрам товары не найдены.</p> : null}
      </div>
    </section>
  );
}
