import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/order-statuses";

export const orderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email(),
  comment: z.string().optional().default(""),
  deliveryMethod: z.string().min(2),
  paymentMethod: z.string().min(2),
  region: z.string().optional().default(""),
  city: z.string().optional().default(""),
  novaPoshtaType: z.string().optional().default(""),
  novaPoshtaBranch: z.string().optional().default(""),
  courierAddress: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        price: z.coerce.number().nonnegative(),
        quantity: z.coerce.number().int().positive()
      })
    )
    .min(1)
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES)
});
