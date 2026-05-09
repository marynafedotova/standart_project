"use client";

import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";

type TranslationMap = {
  ru: string;
  en: string;
};

type AttributeItem = {
  name: string;
  nameI18n?: Record<string, string>;
  productCount: number;
};

const EMPTY_TRANSLATIONS: TranslationMap = {
  ru: "",
  en: ""
};

export function AdminAttributeClient({
  title,
  heading,
  createLabel,
  endpoint,
  initialItems
}: {
  title: string;
  heading: string;
  createLabel: string;
  endpoint: string;
  initialItems: AttributeItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newValue, setNewValue] = useState("");
  const [newTranslations, setNewTranslations] = useState<TranslationMap>(EMPTY_TRANSLATIONS);
  const [editingName, setEditingName] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [editingTranslations, setEditingTranslations] = useState<TranslationMap>(EMPTY_TRANSLATIONS);
  const [loadingName, setLoadingName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalProducts = useMemo(() => items.reduce((sum, item) => sum + item.productCount, 0), [items]);

  async function refreshItems() {
    const response = await fetch(endpoint);
    const allItems = (await response.json()) as Array<{ name: string; nameI18n?: Record<string, string> }>;
    setItems((current) =>
      allItems.map((item) => ({
        ...item,
        productCount: current.find((entry) => entry.name === item.name)?.productCount ?? 0
      }))
    );
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingName("new");
    setError("");
    setMessage("");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newValue, nameI18n: newTranslations })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Не вдалося створити значення.");
      setLoadingName("");
      return;
    }

    setNewValue("");
    setNewTranslations(EMPTY_TRANSLATIONS);
    setMessage("Значення створено.");
    await refreshItems();
    setLoadingName("");
  }

  async function renameItem(currentName: string) {
    setLoadingName(currentName);
    setError("");
    setMessage("");

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentName, nextName: editingValue, nameI18n: editingTranslations })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Не вдалося оновити значення.");
      setLoadingName("");
      return;
    }

    const existingCount = items.find((item) => item.name === currentName)?.productCount ?? 0;
    setItems((current) =>
      current.map((item) =>
        item.name === currentName
          ? { name: editingValue.trim(), nameI18n: normalizeTranslations(editingTranslations), productCount: existingCount }
          : item
      )
    );
    setEditingName("");
    setEditingValue("");
    setEditingTranslations(EMPTY_TRANSLATIONS);
    setMessage("Значення оновлено.");
    setLoadingName("");
  }

  async function deleteItem(name: string) {
    setLoadingName(name);
    setError("");
    setMessage("");

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Не вдалося видалити значення.");
      setLoadingName("");
      return;
    }

    setItems((current) => current.filter((item) => item.name !== name));
    setMessage("Значення видалено.");
    setLoadingName("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">{title}</span>
          <h1>{heading}</h1>
          <p>Усього значень: {items.length}. Використань у товарах: {totalProducts}.</p>
        </div>
        <LogoutButton />
      </div>

      <form className="panel formGrid" onSubmit={createItem}>
        <h2>{createLabel}</h2>
        <input type="text" value={newValue} onChange={(event) => setNewValue(event.target.value)} placeholder="Назва українською" required />
        <input type="text" value={newTranslations.ru} onChange={(event) => setNewTranslations((current) => ({ ...current, ru: event.target.value }))} placeholder="Переклад російською" />
        <input type="text" value={newTranslations.en} onChange={(event) => setNewTranslations((current) => ({ ...current, en: event.target.value }))} placeholder="Translation in English" />
        <button type="submit" className="button primary" disabled={loadingName === "new"}>
          {loadingName === "new" ? "Зберігаємо..." : "Створити"}
        </button>
      </form>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>UA</th>
              <th>RU</th>
              <th>EN</th>
              <th>Товарів</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isEditing = editingName === item.name;
              const isBusy = loadingName === item.name;

              return (
                <tr key={item.name}>
                  <td>
                    {isEditing ? <input value={editingValue} onChange={(event) => setEditingValue(event.target.value)} /> : item.name}
                  </td>
                  <td>
                    {isEditing ? (
                      <input value={editingTranslations.ru} onChange={(event) => setEditingTranslations((current) => ({ ...current, ru: event.target.value }))} />
                    ) : (
                      item.nameI18n?.ru ?? "—"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input value={editingTranslations.en} onChange={(event) => setEditingTranslations((current) => ({ ...current, en: event.target.value }))} />
                    ) : (
                      item.nameI18n?.en ?? "—"
                    )}
                  </td>
                  <td>{item.productCount}</td>
                  <td>
                    <div className="actions">
                      {isEditing ? (
                        <>
                          <button type="button" className="button primary" disabled={isBusy} onClick={() => renameItem(item.name)}>
                            Зберегти
                          </button>
                          <button type="button" className="button secondary" disabled={isBusy} onClick={() => { setEditingName(""); setEditingValue(""); setEditingTranslations(EMPTY_TRANSLATIONS); }}>
                            Скасувати
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingName(item.name);
                              setEditingValue(item.name);
                              setEditingTranslations({
                                ru: item.nameI18n?.ru ?? "",
                                en: item.nameI18n?.en ?? ""
                              });
                            }}
                          >
                            Редагувати
                          </button>
                          <button type="button" className="button secondary" disabled={isBusy || item.productCount > 0} onClick={() => deleteItem(item.name)}>
                            Видалити
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

function normalizeTranslations(value: TranslationMap): Record<string, string> | undefined {
  const result = Object.fromEntries(Object.entries(value).filter(([, item]) => item.trim().length > 0));
  return Object.keys(result).length > 0 ? result : undefined;
}
