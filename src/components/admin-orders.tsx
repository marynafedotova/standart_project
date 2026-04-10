import type { DbOrder } from "@/lib/json-db";

export function AdminOrdersSection({ orders }: { orders: DbOrder[] }) {
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
