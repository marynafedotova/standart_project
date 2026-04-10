import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders-v2";
import { orderStatusSchema } from "@/lib/order-validator";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = orderStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный статус заказа." }, { status: 400 });
  }

  const { id } = await params;
  const order = await updateOrderStatus(id, parsed.data.status);

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден." }, { status: 404 });
  }

  return NextResponse.json(order);
}
