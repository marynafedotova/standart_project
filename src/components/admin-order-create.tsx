"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";

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

type FieldErrors = {
  phone?: string;
  email?: string;
  items?: string;
};

const DELIVERY_METHODS = ["Новая почта", "Міст Експрес", "Укрпошта", "Курьер", "Самовывоз"];

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

export function AdminOrderCreate({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("Новая почта");
  const [paymentMethod, setPaymentMethod] = useState("Наложенный платеж");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [novaPoshtaType, setNovaPoshtaType] = useState("Отделение");
  const [novaPoshtaBranch, setNovaPoshtaBranch] = useState("");
  const [courierAddress, setCourierAddress] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ productId: "", quantity: 1, search: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

    const nextErrors: FieldErrors = {};
    if (!validatePhone(phone)) nextErrors.phone = "Введите украинский номер в формате +380 XX XXX XX XX.";
    if (!validateEmail(email)) nextErrors.email = "Введите email в формате name@example.com.";
    if (preparedItems.length === 0) nextErrors.items = "Добавьте хотя бы один товар в заказ.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setLoading(false);
      return;
    }

    setFieldErrors({});

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        phone,
        email,
        comment,
        deliveryMethod,
        paymentMethod,
        region,
        city,
        novaPoshtaType: ["Новая почта", "Укрпошта", "Міст Експрес"].includes(deliveryMethod) ? novaPoshtaType : "",
        novaPoshtaBranch: ["Новая почта", "Укрпошта", "Міст Експрес"].includes(deliveryMethod) ? novaPoshtaBranch : "",
        courierAddress: deliveryMethod === "Курьер" ? courierAddress : "",
        items: preparedItems
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Не удалось создать заказ.");
      setLoading(false);
      return;
    }

    router.push(`/admin/orders/${data.id}`);
    router.refresh();
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Заказ</span>
          <h1>Создать заказ вручную</h1>
        </div>
        <LogoutButton />
      </div>

      <form className="editorGrid" onSubmit={handleSubmit} noValidate>
        <section className="panel formGrid">
          <h2>Клиент и доставка</h2>
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Имя клиента" required />
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
            <option value="Наложенный платеж">Наложенный платеж</option>
            <option value="Оплата картой">Оплата картой</option>
            <option value="Безналичный расчет">Безналичный расчет</option>
          </select>
          <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Область" />
          <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Город" />
          {["Новая почта", "Укрпошта", "Міст Експрес"].includes(deliveryMethod) ? (
            <>
              <select value={novaPoshtaType} onChange={(event) => setNovaPoshtaType(event.target.value)}>
                <option value="Отделение">Отделение</option>
                <option value="Почтомат">Почтомат</option>
              </select>
              <input value={novaPoshtaBranch} onChange={(event) => setNovaPoshtaBranch(event.target.value)} placeholder="Отделение / почтомат / точка выдачи" />
            </>
          ) : null}
          {deliveryMethod === "Курьер" ? <input value={courierAddress} onChange={(event) => setCourierAddress(event.target.value)} placeholder="Адрес курьерской доставки" /> : null}
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={5} placeholder="Комментарий" />
        </section>

        <section className="panel formGrid">
          <h2>Товары</h2>
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
                  placeholder="Введите артикул или название товара"
                />
                {suggestions.length > 0 && !selectedProduct ? (
                  <div className="panel formGrid">
                    {suggestions.map((product) => (
                      <button key={product.id} type="button" className="button secondary" onClick={() => selectProduct(index, product)}>
                        {product.sku} · {product.name} · {product.price} грн
                      </button>
                    ))}
                  </div>
                ) : null}
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(line.quantity)}
                  onChange={(event) => updateLine(index, { quantity: Math.max(1, Number(event.target.value.replace(/\D/g, "")) || 1) })}
                  placeholder="Количество"
                  disabled={!selectedProduct}
                />
                <p>{selectedProduct ? `${selectedProduct.sku} · ${selectedProduct.name}` : "Товар не выбран"}</p>
                <p>{selectedProduct ? `Позиция: ${(selectedProduct.price * line.quantity).toFixed(2)} грн` : ""}</p>
                <button type="button" className="button secondary" onClick={() => removeLine(index)}>Удалить позицию</button>
              </div>
            );
          })}
          {fieldErrors.items ? <p className="errorText">{fieldErrors.items}</p> : null}
          <div className="panel">
            <strong>Итого по заказу: {total.toFixed(2)} грн</strong>
          </div>
          <div className="actions">
            <button type="button" className="button secondary" onClick={addLine}>Добавить товар</button>
            <button type="submit" className="button primary" disabled={loading}>{loading ? "Сохраняем..." : "Создать заказ"}</button>
          </div>
          {error ? <p className="errorText">{error}</p> : null}
        </section>
      </form>
    </section>
  );
}
