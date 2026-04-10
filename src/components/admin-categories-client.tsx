"use client";

import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";

type CategoryItem = {
  name: string;
  productCount: number;
};

export function AdminCategoriesClient({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [loadingName, setLoadingName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalProducts = useMemo(
    () => categories.reduce((sum, category) => sum + category.productCount, 0),
    [categories]
  );

  async function refreshCategories() {
    const response = await fetch("/api/categories");
    const allCategories = (await response.json()) as string[];

    setCategories((current) =>
      allCategories.map((name) => ({
        name,
        productCount: current.find((item) => item.name === name)?.productCount ?? 0
      }))
    );
  }

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingName("new");
    setError("");
    setMessage("");

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось создать категорию.");
      setLoadingName("");
      return;
    }

    setNewCategory("");
    setMessage("Категория создана.");
    await refreshCategories();
    setLoadingName("");
  }

  async function renameCategory(currentName: string) {
    setLoadingName(currentName);
    setError("");
    setMessage("");

    const response = await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentName, nextName: editingValue })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось обновить категорию.");
      setLoadingName("");
      return;
    }

    const existingCount = categories.find((item) => item.name === currentName)?.productCount ?? 0;
    setCategories((current) =>
      current.map((item) =>
        item.name === currentName ? { name: editingValue.trim(), productCount: existingCount } : item
      )
    );
    setEditingCategory("");
    setEditingValue("");
    setMessage("Категория обновлена.");
    setLoadingName("");
  }

  async function deleteCategory(name: string) {
    setLoadingName(name);
    setError("");
    setMessage("");

    const response = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить категорию.");
      setLoadingName("");
      return;
    }

    setCategories((current) => current.filter((item) => item.name !== name));
    setMessage("Категория удалена.");
    setLoadingName("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Категории</span>
          <h1>Управление категориями товаров</h1>
          <p>Всего категорий: {categories.length}. Товаров в этих категориях: {totalProducts}.</p>
        </div>
        <LogoutButton />
      </div>

      <form className="panel formGrid" onSubmit={createCategory}>
        <h2>Новая категория</h2>
        <input
          type="text"
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder="Название категории"
          required
        />
        <button type="submit" className="button primary" disabled={loadingName === "new"}>
          {loadingName === "new" ? "Сохраняем..." : "Создать категорию"}
        </button>
      </form>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Категория</th>
              <th>Товаров</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const isEditing = editingCategory === category.name;
              const isBusy = loadingName === category.name;

              return (
                <tr key={category.name}>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(event) => setEditingValue(event.target.value)}
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td>{category.productCount}</td>
                  <td>
                    <div className="actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="button primary"
                            disabled={isBusy}
                            onClick={() => renameCategory(category.name)}
                          >
                            Сохранить
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingCategory("");
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
                              setEditingCategory(category.name);
                              setEditingValue(category.name);
                            }}
                          >
                            Переименовать
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={isBusy || category.productCount > 0}
                            onClick={() => deleteCategory(category.name)}
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
