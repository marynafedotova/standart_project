"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSelectableExport } from "@/components/export-actions";
import type { DbOrder } from "@/lib/json-db";
import { ORDER_STATUSES } from "@/lib/order-statuses";

export function AdminOrdersClientV4({ initialOrders }: { initialOrders: DbOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const exportUi = useSelectableExport(
    orders.map((order) => order.id),
    "orders"
  );

  async function updateStatus(orderId: string, status: string) {
    setSavingId(orderId);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
    }

    setSavingId(null);
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch =
        !query ||
        [
          `#${order.orderNumber}`,
          order.id,
          order.customerName,
          order.phone,
          order.email,
          ...order.items.map((item) => item.name)
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Замовлення</span>
          <h1>Список усіх замовлень</h1>
        </div>
        <div className="actions">
          <Link href="/admin/orders/new" className="button primary">Нове замовлення</Link>
          <a href={exportUi.allHref} className="button secondary">Excel: усі</a>
          <a
            href={exportUi.hasSelection ? exportUi.selectedHref : undefined}
            className="button secondary"
            aria-disabled={!exportUi.hasSelection}
          >
            Excel: вибрані
          </a>
        </div>
      </div>

      <div className="panel toolbar">
        <label className="checkbox">
          <input type="checkbox" checked={exportUi.allSelected} onChange={() => exportUi.toggleAll()} />
          <span>Вибрати всі</span>
        </label>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Пошук за ID, клієнтом, телефоном, email або товаром"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Усі статуси</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Замовлення</th>
              <th>Клієнт</th>
              <th>Сума</th>
              <th>Дата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={exportUi.selectedIds.includes(order.id)}
                    onChange={() => exportUi.toggleOne(order.id)}
                    aria-label={`Вибрати замовлення #${order.orderNumber}`}
                  />
                </td>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>#{order.orderNumber}</Link>
                </td>
                <td>
                  <div>
                    <Link href={`/admin/orders/${order.id}`}>{order.customerName}</Link>
                  </div>
                  <div>{order.phone}</div>
                </td>
                <td>{formatMoney(order.total)}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order.id, event.target.value)}
                    disabled={savingId === order.id}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 ? <p>За поточними фільтрами замовлень немає.</p> : null}
      </div>
    </section>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)} грн`;
}
