import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import { readDb, stampNow, writeDb, type DbClient, type DbOrder, type DbOrderItem } from "@/lib/json-db";
import type { OrderStatus } from "@/lib/order-statuses";

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  email: string;
  comment?: string;
  managerComment?: string;
  deliveryMethod: string;
  paymentMethod: string;
  region?: string;
  city?: string;
  novaPoshtaType?: string;
  novaPoshtaBranch?: string;
  courierAddress?: string;
  items: DbOrderItem[];
};

export async function createOrder(input: CreateOrderInput) {
  const db = await readDb();
  const now = stampNow();
  const total = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const nextOrderNumber = db.orders.reduce((max, order) => Math.max(max, order.orderNumber), 0) + 1;

  const order: DbOrder = {
    id: randomUUID(),
    orderNumber: nextOrderNumber,
    customerName: input.customerName,
    phone: input.phone,
    email: input.email,
    comment: input.comment ?? "",
    managerComment: input.managerComment ?? "",
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
    region: input.region ?? "",
    city: input.city ?? "",
    novaPoshtaType: input.novaPoshtaType ?? "",
    novaPoshtaBranch: input.novaPoshtaBranch ?? "",
    courierAddress: input.courierAddress ?? "",
    status: "Новый",
    total,
    items: input.items,
    createdAt: now,
    updatedAt: now
  };

  db.orders.unshift(order);
  rebuildClientsFromOrders(db.clients, db.orders);
  await writeDb(db);
  await Promise.allSettled([sendOrderEmail(order), sendOrderTelegram(order)]);

  return order;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function getOrders() {
  const db = await readDb();
  return db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const db = await readDb();
  const index = db.orders.findIndex((item) => item.id === orderId);

  if (index === -1) {
    return null;
  }

  db.orders[index] = {
    ...db.orders[index],
    status,
    updatedAt: stampNow()
  };

  await writeDb(db);
  return db.orders[index];
}

export async function updateOrder(
  orderId: string,
  input: CreateOrderInput & { status: OrderStatus }
) {
  const db = await readDb();
  const index = db.orders.findIndex((item) => item.id === orderId);

  if (index === -1) {
    return null;
  }

  const now = stampNow();
  const total = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentOrder = db.orders[index];

  db.orders[index] = {
    ...currentOrder,
    customerName: input.customerName,
    phone: input.phone,
    email: input.email,
    comment: input.comment ?? "",
    managerComment: input.managerComment ?? "",
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
    region: input.region ?? "",
    city: input.city ?? "",
    novaPoshtaType: input.novaPoshtaType ?? "",
    novaPoshtaBranch: input.novaPoshtaBranch ?? "",
    courierAddress: input.courierAddress ?? "",
    status: input.status,
    items: input.items,
    total,
    updatedAt: now
  };

  rebuildClientsFromOrders(db.clients, db.orders);
  await writeDb(db);
  return db.orders[index];
}

function rebuildClientsFromOrders(clients: DbClient[], orders: DbOrder[]) {
  const previousIds = new Map(
    clients.map((client) => [normalizePhone(client.phone), client.id] as const)
  );

  const grouped = new Map<string, DbOrder[]>();
  for (const order of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const phone = normalizePhone(order.phone);
    const current = grouped.get(phone) ?? [];
    current.push(order);
    grouped.set(phone, current);
  }

  const rebuiltClients: DbClient[] = Array.from(grouped.entries()).map(([phone, phoneOrders]) => {
    const latestOrder = [...phoneOrders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return {
      id: previousIds.get(phone) ?? randomUUID(),
      name: latestOrder.customerName,
      phone: latestOrder.phone,
      email: latestOrder.email,
      orderIds: phoneOrders.map((order) => order.id),
      orderNumbers: phoneOrders.map((order) => order.orderNumber).sort((a, b) => a - b),
      totalSpent: phoneOrders.reduce((sum, order) => sum + order.total, 0),
      createdAt: phoneOrders[0]?.createdAt ?? latestOrder.createdAt,
      updatedAt: latestOrder.updatedAt
    };
  });

  clients.splice(0, clients.length, ...rebuiltClients.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

function formatOrderText(order: DbOrder) {
  const items = order.items.map((item) => `- ${item.name} x${item.quantity} · ${item.price} грн`).join("\n");

  return [
    `Новый заказ #${order.orderNumber}`,
    "",
    `Клиент: ${order.customerName}`,
    `Телефон: ${order.phone}`,
    `Email: ${order.email}`,
    `Доставка: ${order.deliveryMethod}`,
    `Область: ${order.region || "-"}`,
    `Город: ${order.city || "-"}`,
    `Пункт выдачи: ${[order.novaPoshtaType, order.novaPoshtaBranch].filter(Boolean).join(", ") || "-"}`,
    `Курьерский адрес: ${order.courierAddress || "-"}`,
    `Оплата: ${order.paymentMethod}`,
    `Статус: ${order.status}`,
    `Комментарий: ${order.comment || "-"}`,
    "",
    "Товары:",
    items,
    "",
    `Итого: ${order.total} грн`
  ].join("\n");
}

function formatOrderHtml(order: DbOrder) {
  const items = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e9e2d8;">${escapeHtml(item.name)}</td><td style="padding:8px 0;border-bottom:1px solid #e9e2d8;text-align:center;">${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #e9e2d8;text-align:right;">${item.price} грн</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#f7f1e8;padding:24px;color:#1b2430;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:20px;padding:28px;border:1px solid #e9e2d8;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b56a2d;">Standard Shop</p>
        <h1 style="margin:0 0 18px;font-size:28px;">Новый заказ</h1>
        <div style="display:grid;gap:8px;margin-bottom:24px;">
          <p style="margin:0;"><strong>Номер:</strong> #${order.orderNumber}</p>
          <p style="margin:0;"><strong>Внутренний ID:</strong> ${escapeHtml(order.id)}</p>
          <p style="margin:0;"><strong>Клиент:</strong> ${escapeHtml(order.customerName)}</p>
          <p style="margin:0;"><strong>Телефон:</strong> ${escapeHtml(order.phone)}</p>
          <p style="margin:0;"><strong>Email:</strong> ${escapeHtml(order.email)}</p>
          <p style="margin:0;"><strong>Доставка:</strong> ${escapeHtml(order.deliveryMethod)}</p>
          <p style="margin:0;"><strong>Область:</strong> ${escapeHtml(order.region || "-")}</p>
          <p style="margin:0;"><strong>Город:</strong> ${escapeHtml(order.city || "-")}</p>
          <p style="margin:0;"><strong>Пункт выдачи:</strong> ${escapeHtml(
            [order.novaPoshtaType, order.novaPoshtaBranch].filter(Boolean).join(", ") || "-"
          )}</p>
          <p style="margin:0;"><strong>Курьерский адрес:</strong> ${escapeHtml(order.courierAddress || "-")}</p>
          <p style="margin:0;"><strong>Оплата:</strong> ${escapeHtml(order.paymentMethod)}</p>
          <p style="margin:0;"><strong>Статус:</strong> ${escapeHtml(order.status)}</p>
          <p style="margin:0;"><strong>Комментарий:</strong> ${escapeHtml(order.comment || "-")}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:10px;border-bottom:2px solid #d9d0c4;">Товар</th>
              <th style="text-align:center;padding-bottom:10px;border-bottom:2px solid #d9d0c4;">Кол-во</th>
              <th style="text-align:right;padding-bottom:10px;border-bottom:2px solid #d9d0c4;">Цена</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
        <p style="margin:0;font-size:20px;"><strong>Итого: ${order.total} грн</strong></p>
      </div>
    </div>
  `;
}

function formatOrderTelegram(order: DbOrder) {
  const items = order.items.map((item) => `• ${escapeTelegram(item.name)} x${item.quantity} — ${item.price} грн`).join("\n");

  return [
    `<b>Новый заказ</b>`,
    `<b>Заказ:</b> <code>#${order.orderNumber}</code>`,
    `<b>ID:</b> <code>${escapeTelegram(order.id)}</code>`,
    `<b>Клиент:</b> ${escapeTelegram(order.customerName)}`,
    `<b>Телефон:</b> ${escapeTelegram(order.phone)}`,
    `<b>Email:</b> ${escapeTelegram(order.email)}`,
    `<b>Доставка:</b> ${escapeTelegram(order.deliveryMethod)}`,
    `<b>Область:</b> ${escapeTelegram(order.region || "-")}`,
    `<b>Город:</b> ${escapeTelegram(order.city || "-")}`,
    `<b>Пункт выдачи:</b> ${escapeTelegram([order.novaPoshtaType, order.novaPoshtaBranch].filter(Boolean).join(", ") || "-")}`,
    `<b>Курьерский адрес:</b> ${escapeTelegram(order.courierAddress || "-")}`,
    `<b>Оплата:</b> ${escapeTelegram(order.paymentMethod)}`,
    `<b>Статус:</b> ${escapeTelegram(order.status)}`,
    `<b>Комментарий:</b> ${escapeTelegram(order.comment || "-")}`,
    "",
    `<b>Товары:</b>`,
    items,
    "",
    `<b>Итого:</b> ${order.total} грн`
  ].join("\n");
}

async function sendOrderEmail(order: DbOrder) {
  const to = process.env.ORDER_EMAIL_TO;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!to || !host || !user || !pass) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: user,
    to,
    subject: `Новый заказ #${order.orderNumber}`,
    text: formatOrderText(order),
    html: formatOrderHtml(order)
  });
}

async function sendOrderTelegram(order: DbOrder) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatOrderTelegram(order),
      parse_mode: "HTML"
    })
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeTelegram(value: string) {
  return escapeHtml(value);
}
