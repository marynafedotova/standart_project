"use client";

import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";

type BrandItem = {
  name: string;
  productCount: number;
};

export function AdminBrandsClient({ initialBrands }: { initialBrands: BrandItem[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [newBrand, setNewBrand] = useState("");
  const [editingBrand, setEditingBrand] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [loadingName, setLoadingName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalProducts = useMemo(
    () => brands.reduce((sum, brand) => sum + brand.productCount, 0),
    [brands]
  );

  async function refreshBrands() {
    const response = await fetch("/api/brands");
    const allBrands = (await response.json()) as string[];

    setBrands((current) =>
      allBrands.map((name) => ({
        name,
        productCount: current.find((item) => item.name === name)?.productCount ?? 0
      }))
    );
  }

  async function createBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingName("new");
    setError("");
    setMessage("");

    const response = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBrand })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось создать бренд.");
      setLoadingName("");
      return;
    }

    setNewBrand("");
    setMessage("Бренд создан.");
    await refreshBrands();
    setLoadingName("");
  }

  async function renameBrand(currentName: string) {
    setLoadingName(currentName);
    setError("");
    setMessage("");

    const response = await fetch("/api/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentName, nextName: editingValue })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось обновить бренд.");
      setLoadingName("");
      return;
    }

    const existingCount = brands.find((item) => item.name === currentName)?.productCount ?? 0;
    setBrands((current) =>
      current.map((item) =>
        item.name === currentName ? { name: editingValue.trim(), productCount: existingCount } : item
      )
    );
    setEditingBrand("");
    setEditingValue("");
    setMessage("Бренд обновлён.");
    setLoadingName("");
  }

  async function deleteBrand(name: string) {
    setLoadingName(name);
    setError("");
    setMessage("");

    const response = await fetch("/api/brands", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить бренд.");
      setLoadingName("");
      return;
    }

    setBrands((current) => current.filter((item) => item.name !== name));
    setMessage("Бренд удалён.");
    setLoadingName("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Бренды</span>
          <h1>Управление брендами товаров</h1>
          <p>Всего брендов: {brands.length}. Товаров с брендами: {totalProducts}.</p>
        </div>
        <LogoutButton />
      </div>

      <form className="panel formGrid" onSubmit={createBrand}>
        <h2>Новый бренд</h2>
        <input
          type="text"
          value={newBrand}
          onChange={(event) => setNewBrand(event.target.value)}
          placeholder="Название бренда"
          required
        />
        <button type="submit" className="button primary" disabled={loadingName === "new"}>
          {loadingName === "new" ? "Сохраняем..." : "Создать бренд"}
        </button>
      </form>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Бренд</th>
              <th>Товаров</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => {
              const isEditing = editingBrand === brand.name;
              const isBusy = loadingName === brand.name;

              return (
                <tr key={brand.name}>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(event) => setEditingValue(event.target.value)}
                      />
                    ) : (
                      brand.name
                    )}
                  </td>
                  <td>{brand.productCount}</td>
                  <td>
                    <div className="actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="button primary"
                            disabled={isBusy}
                            onClick={() => renameBrand(brand.name)}
                          >
                            Сохранить
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingBrand("");
                              setEditingValue("");
                            }}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingBrand(brand.name);
                              setEditingValue(brand.name);
                            }}
                          >
                            Переименовать
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={isBusy || brand.productCount > 0}
                            onClick={() => deleteBrand(brand.name)}
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error ? <p className="errorText">{error}</p> : null}
      {message ? <p className="successText">{message}</p> : null}
    </section>
  );
}
