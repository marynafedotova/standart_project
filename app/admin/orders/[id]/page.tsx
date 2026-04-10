import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoutButton } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth";
import { getOrderById } from "@/lib/store";

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const hasPickupPoint = ["Новая почта", "Укрпошта", "Міст Експрес"].includes(order.deliveryMethod);
  const isCourier = order.deliveryMethod === "Курьер";

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Заказ</span>
          <h1>Детали заказа #{order.orderNumber}</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="editorGrid">
        <div className="panel formGrid">
          <p><strong>Номер заказа:</strong> #{order.orderNumber}</p>
          <p><strong>Внутренний ID:</strong> {order.id}</p>
          <p><strong>Клиент:</strong> {order.customerName}</p>
          <p><strong>Телефон:</strong> {order.phone}</p>
          <p><strong>Email:</strong> {order.email}</p>
          <p><strong>Доставка:</strong> {order.deliveryMethod}</p>
          <p><strong>Область:</strong> {order.region || "—"}</p>
          <p><strong>Город:</strong> {order.city || "—"}</p>
          {hasPickupPoint ? (
            <>
              <p><strong>Тип пункта выдачи:</strong> {order.novaPoshtaType || "—"}</p>
              <p><strong>Отделение / почтомат / точка выдачи:</strong> {order.novaPoshtaBranch || "—"}</p>
            </>
          ) : null}
          {isCourier ? (
            <p><strong>Адрес курьерской доставки:</strong> {order.courierAddress || "—"}</p>
          ) : null}
          <p><strong>Оплата:</strong> {order.paymentMethod}</p>
          <p><strong>Статус:</strong> {order.status}</p>
          <p><strong>Сумма:</strong> {formatMoney(order.total)}</p>
          <p><strong>Комментарий:</strong> {order.comment || "—"}</p>
        </div>

        <div className="panel formGrid">
          <h2>Товары в заказе</h2>
          {order.items.map((item) => (
            <div key={`${order.id}-${item.productId}`} className="cartItem">
              <div>
                <strong>{item.name}</strong>
                <p>Количество: {item.quantity}</p>
              </div>
              <span>{formatMoney(item.price)}</span>
            </div>
          ))}
          <Link href="/admin/orders" className="button secondary">
            Назад к заказам
          </Link>
        </div>
      </div>
    </section>
  );
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)} грн`;
}
