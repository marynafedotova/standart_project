export const ORDER_STATUSES = ["Нове", "В обробці", "Відправлено", "Виконано"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
