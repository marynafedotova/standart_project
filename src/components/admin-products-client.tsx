"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminProduct } from "@/components/admin-ui";
import { useSelectableExport } from "@/components/export-actions";

const PRODUCT_STATUSES = ["Активен", "Черновик", "Нет в наличии"] as const;

type ProductStatus = (typeof PRODUCT_STATUSES)[number];

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value)} грн`;
}

export function AdminProductsClient({ products }: { products: AdminProduct[] }) {
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

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Товары</span>
          <h1>Список товаров</h1>
        </div>
        <div className="actions">
          <Link href="/admin/product/new" className="button primary">Создать товар</Link>
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
      </div>
      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Артикул</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
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
      </div>
    </section>
  );
}
