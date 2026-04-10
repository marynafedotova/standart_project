"use client";

import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";

type SeasonItem = {
  name: string;
  productCount: number;
};

export function AdminSeasonsClient({ initialSeasons }: { initialSeasons: SeasonItem[] }) {
  const [seasons, setSeasons] = useState(initialSeasons);
  const [newSeason, setNewSeason] = useState("");
  const [editingSeason, setEditingSeason] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [loadingName, setLoadingName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalProducts = useMemo(
    () => seasons.reduce((sum, season) => sum + season.productCount, 0),
    [seasons]
  );

  async function refreshSeasons() {
    const response = await fetch("/api/seasons");
    const allSeasons = (await response.json()) as string[];

    setSeasons((current) =>
      allSeasons.map((name) => ({
        name,
        productCount: current.find((item) => item.name === name)?.productCount ?? 0
      }))
    );
  }

  async function createSeason(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingName("new");
    setError("");
    setMessage("");

    const response = await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSeason })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось создать сезон.");
      setLoadingName("");
      return;
    }

    setNewSeason("");
    setMessage("Сезон создан.");
    await refreshSeasons();
    setLoadingName("");
  }

  async function renameSeason(currentName: string) {
    setLoadingName(currentName);
    setError("");
    setMessage("");

    const response = await fetch("/api/seasons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentName, nextName: editingValue })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось обновить сезон.");
      setLoadingName("");
      return;
    }

    const existingCount = seasons.find((item) => item.name === currentName)?.productCount ?? 0;
    setSeasons((current) =>
      current.map((item) =>
        item.name === currentName ? { name: editingValue.trim(), productCount: existingCount } : item
      )
    );
    setEditingSeason("");
    setEditingValue("");
    setMessage("Сезон обновлен.");
    setLoadingName("");
  }

  async function deleteSeason(name: string) {
    setLoadingName(name);
    setError("");
    setMessage("");

    const response = await fetch("/api/seasons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить сезон.");
      setLoadingName("");
      return;
    }

    setSeasons((current) => current.filter((item) => item.name !== name));
    setMessage("Сезон удален.");
    setLoadingName("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Сезоны</span>
          <h1>Управление сезонами товаров</h1>
          <p>Всего сезонов: {seasons.length}. Товаров с сезонами: {totalProducts}.</p>
        </div>
        <LogoutButton />
      </div>

      <form className="panel formGrid" onSubmit={createSeason}>
        <h2>Новый сезон</h2>
        <input type="text" value={newSeason} onChange={(event) => setNewSeason(event.target.value)} placeholder="Название сезона" required />
        <button type="submit" className="button primary" disabled={loadingName === "new"}>
          {loadingName === "new" ? "Сохраняем..." : "Создать сезон"}
        </button>
      </form>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Сезон</th>
              <th>Товаров</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => {
              const isEditing = editingSeason === season.name;
              const isBusy = loadingName === season.name;

              return (
                <tr key={season.name}>
                  <td>
                    {isEditing ? (
                      <input type="text" value={editingValue} onChange={(event) => setEditingValue(event.target.value)} />
                    ) : (
                      season.name
                    )}
                  </td>
                  <td>{season.productCount}</td>
                  <td>
                    <div className="actions">
                      {isEditing ? (
                        <>
                          <button type="button" className="button primary" disabled={isBusy} onClick={() => renameSeason(season.name)}>
                            Сохранить
                          </button>
                          <button type="button" className="button secondary" disabled={isBusy} onClick={() => { setEditingSeason(""); setEditingValue(""); }}>
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="button secondary" disabled={isBusy} onClick={() => { setEditingSeason(season.name); setEditingValue(season.name); }}>
                            Переименовать
                          </button>
                          <button type="button" className="button secondary" disabled={isBusy || season.productCount > 0} onClick={() => deleteSeason(season.name)}>
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
