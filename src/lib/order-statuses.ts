export const ORDER_STATUSES = ["Новый", "В обработке", "Отправлен", "Выполнен"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
