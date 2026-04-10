"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DbOrder } from "@/lib/json-db";
import { ORDER_STATUSES } from "@/lib/order-statuses";

export function AdminOrdersClientV3({ initialOrders }: { initialOrders: DbOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

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
          <span className="eyebrow">Заказы</span>
          <h1>Список всех заказов</h1>
        </div>
      </div>

      <div className="panel toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по ID, клиенту, телефону, email или товару"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Все статусы</option>
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
              <th>Заказ</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Дата</th>
              <th>Статус</th>
              <th>Детали</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id.slice(0, 8)}</td>
                <td>
                  <div>{order.customerName}</div>
                  <div>{order.phone}</div>
                </td>
                <td>{order.total} грн</td>
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
                <td>
                  <Link href={`/admin/orders/${order.id}`}>Открыть</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 ? <p>Заказов по текущим фильтрам нет.</p> : null}
      </div>
    </section>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}
