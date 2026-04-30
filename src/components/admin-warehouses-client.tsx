"use client";

import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";

type WarehouseItem = {
  name: string;
  productCount: number;
  units: number;
};

export function AdminWarehousesClient({ initialWarehouses }: { initialWarehouses: WarehouseItem[] }) {
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [newWarehouse, setNewWarehouse] = useState("");
  const [editingWarehouse, setEditingWarehouse] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [loadingName, setLoadingName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalUnits = useMemo(
    () => warehouses.reduce((sum, warehouse) => sum + warehouse.units, 0),
    [warehouses]
  );

  async function refreshWarehouses() {
    const response = await fetch("/api/warehouses");
    const allWarehouses = (await response.json()) as string[];

    setWarehouses((current) =>
      allWarehouses.map((name) => ({
        name,
        productCount: current.find((item) => item.name === name)?.productCount ?? 0,
        units: current.find((item) => item.name === name)?.units ?? 0
      }))
    );
  }

  async function createWarehouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingName("new");
    setError("");
    setMessage("");

    const response = await fetch("/api/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWarehouse })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось создать склад.");
      setLoadingName("");
      return;
    }

    setNewWarehouse("");
    setMessage("Склад создан.");
    await refreshWarehouses();
    setLoadingName("");
  }

  async function renameWarehouse(currentName: string) {
    setLoadingName(currentName);
    setError("");
    setMessage("");

    const response = await fetch("/api/warehouses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentName, nextName: editingValue })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось обновить склад.");
      setLoadingName("");
      return;
    }

    const currentWarehouse = warehouses.find((item) => item.name === currentName);
    setWarehouses((items) =>
      items.map((item) =>
        item.name === currentName
          ? {
              name: editingValue.trim(),
              productCount: currentWarehouse?.productCount ?? 0,
              units: currentWarehouse?.units ?? 0
            }
          : item
      )
    );
    setEditingWarehouse("");
    setEditingValue("");
    setMessage("Склад обновлен.");
    setLoadingName("");
  }

  async function deleteWarehouse(name: string) {
    setLoadingName(name);
    setError("");
    setMessage("");

    const response = await fetch("/api/warehouses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить склад.");
      setLoadingName("");
      return;
    }

    setWarehouses((items) => items.filter((item) => item.name !== name));
    setMessage("Склад удален.");
    setLoadingName("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Склады</span>
          <h1>Управление складами</h1>
          <p>Всего складов: {warehouses.length}. Товарных единиц на складах: {totalUnits}.</p>
        </div>
        <LogoutButton />
      </div>

      <form className="panel formGrid" onSubmit={createWarehouse}>
        <h2>Новый склад</h2>
        <input
          type="text"
          value={newWarehouse}
          onChange={(event) => setNewWarehouse(event.target.value)}
          placeholder="Название склада"
          required
        />
        <button type="submit" className="button primary" disabled={loadingName === "new"}>
          {loadingName === "new" ? "Сохраняем..." : "Создать склад"}
        </button>
      </form>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Склад</th>
              <th>Товаров</th>
              <th>Единиц</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((warehouse) => {
              const isEditing = editingWarehouse === warehouse.name;
              const isBusy = loadingName === warehouse.name;

              return (
                <tr key={warehouse.name}>
                  <td>
                    {isEditing ? (
                      <input value={editingValue} onChange={(event) => setEditingValue(event.target.value)} />
                    ) : (
                      warehouse.name
                    )}
                  </td>
                  <td>{warehouse.productCount}</td>
                  <td>{warehouse.units}</td>
                  <td>
                    <div className="actions">
                      {isEditing ? (
                        <>
                          <button type="button" className="button primary" disabled={isBusy} onClick={() => renameWarehouse(warehouse.name)}>
                            Сохранить
                          </button>
                          <button type="button" className="button secondary" disabled={isBusy} onClick={() => { setEditingWarehouse(""); setEditingValue(""); }}>
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="button secondary" disabled={isBusy} onClick={() => { setEditingWarehouse(warehouse.name); setEditingValue(warehouse.name); }}>
                            Переименовать
                          </button>
                          <button type="button" className="button secondary" disabled={isBusy || warehouse.units > 0} onClick={() => deleteWarehouse(warehouse.name)}>
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
