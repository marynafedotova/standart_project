"use client";

import { useState } from "react";
import { useShopState } from "@/components/shop-state";
import type { StoreProduct } from "@/components/storefront-db";

export function ProductCardActions({ product }: { product: StoreProduct }) {
  const { addToCart, toggleFavorite, isInCart, isFavorite } = useShopState();

  return (
    <div className="cardActions">
      <button
        type="button"
        className="button primary compactButton"
        onClick={() => addToCart(product.id)}
      >
        {isInCart(product.id) ? "В корзине" : "В корзину"}
      </button>
      <button
        type="button"
        className="button secondary compactButton"
        onClick={() => toggleFavorite(product.id)}
      >
        {isFavorite(product.id) ? "В избранном" : "В избранное"}
      </button>
    </div>
  );
}

export function ProductDetailActions({ product }: { product: StoreProduct }) {
  const { addToCart, toggleFavorite, isInCart, isFavorite } = useShopState();

  return (
    <div className="actions">
      <button type="button" className="button primary" onClick={() => addToCart(product.id)}>
        {isInCart(product.id) ? "Уже в корзине" : "Добавить в корзину"}
      </button>
      <button type="button" className="button secondary" onClick={() => toggleFavorite(product.id)}>
        {isFavorite(product.id) ? "Убрать из избранного" : "Добавить в избранное"}
      </button>
    </div>
  );
}

export function CartClientView({ products }: { products: StoreProduct[] }) {
  const { cartIds, removeFromCart, clearCart } = useShopState();
  const items = products.filter((product) => cartIds.includes(product.id));
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("Новая почта");
  const [paymentMethod, setPaymentMethod] = useState("Наложенный платеж");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

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
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось оформить заказ.");
      setLoading(false);
      return;
    }

    clearCart();
    setMessage("Заказ оформлен. Мы сохранили его в админке и отправили уведомления по настроенным каналам.");
    setCustomerName("");
    setPhone("");
    setEmail("");
    setComment("");
    setLoading(false);
  }

  return (
    <main className="page section container twoColumn">
      <section className="panel">
        <h1>Корзина</h1>
        {items.length === 0 ? <p>Корзина пока пуста.</p> : null}
        {items.map((product) => (
          <div key={product.id} className="cartItem">
            <img src={product.image} alt={product.name} className="miniThumb plainImage" />
            <div>
              <strong>{product.name}</strong>
              <p>{product.price} грн</p>
            </div>
            <button type="button" className="button secondary compactButton" onClick={() => removeFromCart(product.id)}>
              Удалить
            </button>
          </div>
        ))}
      </section>
      <aside className="panel">
        <h2>Итого</h2>
        <div className="metaLine">
          <span>{items.length} товара</span>
          <strong>{total} грн</strong>
        </div>
        <form className="formGrid topGap" onSubmit={handleCheckout}>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} type="text" placeholder="Ваше имя" required />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Телефон" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
          <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
            <option value="Новая почта">Новая почта</option>
            <option value="Курьер">Курьер</option>
            <option value="Самовывоз">Самовывоз</option>
          </select>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="Наложенный платеж">Наложенный платеж</option>
            <option value="Оплата картой">Оплата картой</option>
            <option value="Безналичный расчет">Безналичный расчет</option>
          </select>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Комментарий к заказу" />
          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}
          <button type="submit" className="button primary full" disabled={items.length === 0 || loading}>
            {loading ? "Отправляем..." : "Оформить заказ"}
          </button>
        </form>
      </aside>
    </main>
  );
}

export function FavoritesClientView({ products }: { products: StoreProduct[] }) {
  const { favoriteIds } = useShopState();
  const items = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <main className="page section container">
      <div className="sectionHeading compact">
        <span className="eyebrow">Избранное</span>
        <h1>Сохраненные товары</h1>
      </div>
      {items.length === 0 ? <div className="panel"><p>Вы пока ничего не добавили в избранное.</p></div> : null}
      <div className="productGrid">
        {items.map((product) => (
          <article key={product.id} className="productCard">
            <img src={product.image} alt={product.name} className="cardImage plainImage" />
            <div className="cardBody">
              <div className="metaLine">
                <span>{product.category}</span>
                <span>{product.badge ?? "In stock"}</span>
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="metaLine">
                <strong>{product.price} грн</strong>
                <a href={`/product/${product.slug}`}>Подробнее</a>
              </div>
              <ProductCardActions product={product} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
