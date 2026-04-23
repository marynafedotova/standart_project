import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { updateOrder, updateOrderStatus } from "@/lib/orders-v3";
import { orderEditSchema, orderStatusSchema } from "@/lib/order-validator";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;
  const statusOnly = orderStatusSchema.safeParse(body);

  if (statusOnly.success && Object.keys(body).length === 1) {
    const order = await updateOrderStatus(id, statusOnly.data.status);

    if (!order) {
      return NextResponse.json({ error: "Заказ не найден." }, { status: 404 });
    }

    return NextResponse.json(order);
  }

  const parsed = orderEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные заказа." }, { status: 400 });
  }

  const order = await updateOrder(id, parsed.data);

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден." }, { status: 404 });
  }

  return NextResponse.json(order);
}
