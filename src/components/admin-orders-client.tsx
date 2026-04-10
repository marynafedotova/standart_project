"use client";

import { useState } from "react";
import type { DbOrder } from "@/lib/json-db";
import { ORDER_STATUSES } from "@/lib/order-statuses";

export function AdminOrdersClient({ initialOrders }: { initialOrders: DbOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Заказы</span>
          <h1>Новые и оформленные заказы</h1>
        </div>
      </div>
      <div className="blogGrid">
        {orders.length === 0 ? <div className="panel"><p>Заказов пока нет.</p></div> : null}
        {orders.map((order) => (
          <article key={order.id} className="panel">
            <div className="metaLine">
              <span>{order.status}</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <h2>{order.customerName}</h2>
            <p>{order.phone} · {order.email}</p>
            <p>{order.deliveryMethod} · {order.paymentMethod}</p>
            <p>Сумма: {order.total} грн</p>
            <label className="formGrid">
              <span>Статус заказа</span>
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
            </label>
            <div className="orderItems">
              {order.items.map((item) => (
                <p key={`${order.id}-${item.productId}`}>{item.name} x{item.quantity}</p>
              ))}
            </div>
            {order.comment ? <p>{order.comment}</p> : null}
          </article>
        ))}
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
