"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import { ORDER_STATUSES } from "@/lib/order-statuses";

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  price: number;
};

type OrderLine = {
  productId: string;
  quantity: number;
  search: string;
};

type EditableOrder = {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  email: string;
  comment: string;
  managerComment: string;
  deliveryMethod: string;
  paymentMethod: string;
  region: string;
  city: string;
  novaPoshtaType: string;
  novaPoshtaBranch: string;
  courierAddress: string;
  status: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
};

type FieldErrors = {
  phone?: string;
  email?: string;
  items?: string;
};

const DELIVERY_METHODS = ["Нова пошта", "Meest", "Укрпошта", "Кур'єр", "Самовивіз"];

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatUkrainianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("380")
    ? digits.slice(0, 12)
    : digits.startsWith("0")
      ? `38${digits}`.slice(0, 12)
      : `380${digits}`.slice(0, 12);

  const country = normalized.slice(0, 3);
  const code = normalized.slice(3, 5);
  const part1 = normalized.slice(5, 8);
  const part2 = normalized.slice(8, 10);
  const part3 = normalized.slice(10, 12);

  let result = "";
  if (country) result = `+${country}`;
  if (code) result += ` ${code}`;
  if (part1) result += ` ${part1}`;
  if (part2) result += ` ${part2}`;
  if (part3) result += ` ${part3}`;
  return result.trim();
}

function validatePhone(phone: string) {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length === 12 && digitsOnly.startsWith("380");
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function findExactProduct(products: ProductOption[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  return (
    products.find((product) => product.sku.toLowerCase() === normalized) ??
    products.find((product) => product.name.toLowerCase() === normalized) ??
    null
  );
}

function buildInitialLines(initialOrder: EditableOrder | null, products: ProductOption[]) {
  if (!initialOrder || initialOrder.items.length === 0) {
    return [{ productId: "", quantity: 1, search: "" }];
  }

  return initialOrder.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      search: product ? `${product.sku} ${product.name}` : item.name
    };
  });
}

export function AdminOrderCreate({
  products,
  initialOrder = null
}: {
  products: ProductOption[];
  initialOrder?: EditableOrder | null;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialOrder);
  const [customerName, setCustomerName] = useState(initialOrder?.customerName ?? "");
  const [phone, setPhone] = useState(initialOrder?.phone ?? "");
  const [email, setEmail] = useState(initialOrder?.email ?? "");
  const [comment, setComment] = useState(initialOrder?.comment ?? "");
  const [managerComment, setManagerComment] = useState(initialOrder?.managerComment ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState(initialOrder?.deliveryMethod ?? "Нова пошта");
  const [paymentMethod, setPaymentMethod] = useState(initialOrder?.paymentMethod ?? "Післяплата");
  const [region, setRegion] = useState(initialOrder?.region ?? "");
  const [city, setCity] = useState(initialOrder?.city ?? "");
  const [novaPoshtaType, setNovaPoshtaType] = useState(initialOrder?.novaPoshtaType ?? "Відділення");
  const [novaPoshtaBranch, setNovaPoshtaBranch] = useState(initialOrder?.novaPoshtaBranch ?? "");
  const [courierAddress, setCourierAddress] = useState(initialOrder?.courierAddress ?? "");
  const [status, setStatus] = useState(initialOrder?.status ?? "Нове");
  const [lines, setLines] = useState<OrderLine[]>(() => buildInitialLines(initialOrder, products));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  function updateLine(index: number, next: Partial<OrderLine>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...next } : line)));
  }

  function handleSearchChange(index: number, value: string) {
    const exactProduct = findExactProduct(products, value);
    updateLine(index, {
      search: value,
      productId: exactProduct?.id ?? (value.trim() ? lines[index]?.productId ?? "" : "")
    });
  }

  function selectProduct(index: number, product: ProductOption) {
    updateLine(index, { productId: product.id, search: `${product.sku} ${product.name}` });
  }

  function addLine() {
    setLines((current) => [...current, { productId: "", quantity: 1, search: "" }]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? [{ productId: "", quantity: 1, search: "" }] : current.filter((_, lineIndex) => lineIndex !== index)));
  }

  const preparedItems = lines
    .filter((line) => line.productId)
    .map((line) => {
      const product = productMap.get(line.productId);
      return product
        ? {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: Math.max(1, line.quantity)
          }
        : null;
    })
    .filter((item): item is { productId: string; name: string; price: number; quantity: number } => Boolean(item));

  const total = preparedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const nextErrors: FieldErrors = {};
    if (!validatePhone(phone)) nextErrors.phone = "Введіть український номер у форматі +380 XX XXX XX XX.";
    if (!validateEmail(email)) nextErrors.email = "Введіть email у форматі name@example.com.";
    if (preparedItems.length === 0) nextErrors.items = "Додайте хоча б один товар до замовлення.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setLoading(false);
      return;
    }

    setFieldErrors({});

    const payload = {
      customerName,
      phone,
      email,
      comment,
      managerComment,
      deliveryMethod,
      paymentMethod,
      region,
      city,
      novaPoshtaType: ["Нова пошта", "Укрпошта", "Meest"].includes(deliveryMethod) ? novaPoshtaType : "",
      novaPoshtaBranch: ["Нова пошта", "Укрпошта", "Meest"].includes(deliveryMethod) ? novaPoshtaBranch : "",
      courierAddress: deliveryMethod === "Кур'єр" ? courierAddress : "",
      items: preparedItems,
      ...(isEditing ? { status } : {})
    };

    const response = await fetch(isEditing ? `/api/orders/${initialOrder?.id}` : "/api/orders", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await readJsonSafely(response);
    if (!response.ok) {
      setError(
        (typeof data?.error === "string" ? data.error : null) ??
          (isEditing ? "Не вдалося оновити замовлення." : "Не вдалося створити замовлення.")
      );
      setLoading(false);
      return;
    }

    if (isEditing) {
      setMessage("Замовлення оновлено.");
      router.refresh();
    } else {
      const nextId = typeof data?.id === "string" ? data.id : null;
      if (nextId) {
        router.push(`/admin/orders/${nextId}`);
      }
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Замовлення</span>
          <h1>{isEditing ? `Редагування замовлення #${initialOrder?.orderNumber}` : "Створення замовлення вручну"}</h1>
        </div>
        <LogoutButton />
      </div>

      <form className="editorGrid" onSubmit={handleSubmit} noValidate>
        <section className="panel formGrid">
          <h2>Клієнт і доставка</h2>
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Ім'я клієнта" required />
          <div>
            <input
              value={phone}
              onFocus={() => {
                if (!phone.trim()) setPhone("+380");
              }}
              onChange={(event) => {
                setPhone(formatUkrainianPhone(event.target.value));
                setFieldErrors((current) => ({ ...current, phone: undefined }));
              }}
              placeholder="+380 XX XXX XX XX"
            />
            {fieldErrors.phone ? <p className="errorText">{fieldErrors.phone}</p> : null}
          </div>
          <div>
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="Email"
              required
            />
            {fieldErrors.email ? <p className="errorText">{fieldErrors.email}</p> : null}
          </div>
          <select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)}>
            {DELIVERY_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value="Післяплата">Післяплата</option>
            <option value="Оплата карткою">Оплата карткою</option>
            <option value="Безготівковий розрахунок">Безготівковий розрахунок</option>
          </select>
          {isEditing ? (
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {ORDER_STATUSES.map((orderStatus) => <option key={orderStatus} value={orderStatus}>{orderStatus}</option>)}
            </select>
          ) : null}
          <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Область" />
          <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Місто" />
          {["Нова пошта", "Укрпошта", "Meest"].includes(deliveryMethod) ? (
            <>
              <select value={novaPoshtaType} onChange={(event) => setNovaPoshtaType(event.target.value)}>
                <option value="Відділення">Відділення</option>
                <option value="Поштомат">Поштомат</option>
              </select>
              <input value={novaPoshtaBranch} onChange={(event) => setNovaPoshtaBranch(event.target.value)} placeholder="Відділення / поштомат / точка видачі" />
            </>
          ) : null}
          {deliveryMethod === "Кур'єр" ? <input value={courierAddress} onChange={(event) => setCourierAddress(event.target.value)} placeholder="Адреса кур'єрської доставки" /> : null}
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} placeholder="Коментар клієнта" />
          <textarea value={managerComment} onChange={(event) => setManagerComment(event.target.value)} rows={4} placeholder="Коментар менеджера" />
        </section>

        <section className="panel formGrid">
          <h2>Товари в замовленні</h2>
          {lines.map((line, index) => {
            const query = line.search.trim().toLowerCase();
            const selectedProduct = line.productId ? productMap.get(line.productId) : null;
            const suggestions = query
              ? products.filter((product) => [product.sku, product.name].join(" ").toLowerCase().includes(query)).slice(0, 8)
              : [];

            return (
              <div key={`line-${index}`} className="panel formGrid">
                <input
                  value={line.search}
                  onChange={(event) => handleSearchChange(index, event.target.value)}
                  type="search"
                  placeholder="Введіть артикул або назву товару"
                />
                {suggestions.length > 0 && !selectedProduct ? (
                  <div className="panel formGrid">
                    {suggestions.map((product) => (
                      <button key={product.id} type="button" className="button secondary" onClick={() => selectProduct(index, product)}>
                        {product.sku} · {product.name} · {product.price.toFixed(2)} грн
                      </button>
                    ))}
                  </div>
                ) : null}
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(line.quantity)}
                  onChange={(event) => updateLine(index, { quantity: Math.max(1, Number(event.target.value.replace(/\D/g, "")) || 1) })}
                  placeholder="Кількість"
                  disabled={!selectedProduct}
                />
                <p>{selectedProduct ? `${selectedProduct.sku} · ${selectedProduct.name}` : "Товар не вибрано"}</p>
                <p>{selectedProduct ? `Позиція: ${(selectedProduct.price * line.quantity).toFixed(2)} грн` : ""}</p>
                <button type="button" className="button secondary" onClick={() => removeLine(index)}>Видалити позицію</button>
              </div>
            );
          })}
          {fieldErrors.items ? <p className="errorText">{fieldErrors.items}</p> : null}
          <div className="panel">
            <strong>Разом по замовленню: {total.toFixed(2)} грн</strong>
          </div>
          <div className="actions">
            <button type="button" className="button secondary" onClick={addLine}>Додати товар</button>
            <button type="submit" className="button primary" disabled={loading}>{loading ? "Зберігаємо..." : isEditing ? "Зберегти замовлення" : "Створити замовлення"}</button>
          </div>
          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}
        </section>
      </form>
    </section>
  );
}
