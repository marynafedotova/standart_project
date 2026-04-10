import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoutButton } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth";
import { getClientById, getOrdersForAdmin } from "@/lib/store";

export default async function AdminClientDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const orders = (await getOrdersForAdmin()).filter((order) => client.orderIds.includes(order.id));

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Клиент</span>
          <h1>{client.name}</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="editorGrid">
        <div className="panel formGrid">
          <p><strong>Телефон:</strong> {client.phone}</p>
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>Заказов:</strong> {client.orderIds.length}</p>
          <p><strong>Номера заказов:</strong> {client.orderNumbers.map((number) => `#${number}`).join(", ") || "—"}</p>
          <p><strong>Потрачено:</strong> {client.totalSpent} грн</p>
          <p><strong>Создан:</strong> {formatDate(client.createdAt)}</p>
          <p><strong>Обновлен:</strong> {formatDate(client.updatedAt)}</p>
        </div>

        <div className="panel formGrid">
          <h2>Заказы клиента</h2>
          {orders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              #{order.orderNumber} · {order.total} грн · {order.status}
            </Link>
          ))}
          <Link href="/admin/clients" className="button secondary">
            Назад к клиентам
          </Link>
        </div>
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
