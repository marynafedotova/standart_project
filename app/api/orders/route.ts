import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/orders-v3";
import { requireAdminApi } from "@/lib/auth";
import { orderSchema } from "@/lib/order-validator";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const orders = await getOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные заказа." }, { status: 400 });
  }

  const order = await createOrder(parsed.data);
  return NextResponse.json(order, { status: 201 });
}
