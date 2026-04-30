"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useShopState } from "@/components/shop-state";
import type { StoreProduct } from "@/components/storefront-db";

type CheckoutFieldErrors = {
  customerName?: string;
  phone?: string;
  email?: string;
  region?: string;
  city?: string;
  novaPoshtaBranch?: string;
  courierAddress?: string;
};

export function ProductCardActions({ product }: { product: StoreProduct }) {
  const t = useTranslations("Cart");
  const { addToCart, toggleFavorite, isInCart, isFavorite } = useShopState();

  return (
    <div className="cardActions">
      <button type="button" className="button primary compactButton" onClick={() => addToCart(product.id)}>
        {isInCart(product.id) ? t("inCart") : t("addToCart")}
      </button>
      <button type="button" className="button secondary compactButton" onClick={() => toggleFavorite(product.id)}>
        {isFavorite(product.id) ? t("inFavorites") : t("addToFavorites")}
      </button>
    </div>
  );
}

export function ProductDetailActions({ product }: { product: StoreProduct }) {
  const t = useTranslations("Cart");
  const { addToCart, toggleFavorite, isInCart, isFavorite } = useShopState();

  return (
    <div className="actions">
      <button type="button" className="button primary" onClick={() => addToCart(product.id)}>
        {isInCart(product.id) ? t("alreadyInCart") : t("addToCart")}
      </button>
      <button type="button" className="button secondary" onClick={() => toggleFavorite(product.id)}>
        {isFavorite(product.id) ? t("removeFavorite") : t("addToFavorites")}
      </button>
    </div>
  );
}

export function CartClientView({ products }: { products: StoreProduct[] }) {
  const t = useTranslations("Cart");
  const { cartItems, addToCart, decrementCartItem, removeFromCart, clearCart, setCartQuantity } = useShopState();
  const items = cartItems
    .map((cartItem) => {
      const product = products.find((item) => item.id === cartItem.productId);
      return product ? { product, quantity: cartItem.quantity } : null;
    })
    .filter((item): item is { product: StoreProduct; quantity: number } => Boolean(item));
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState(t("deliveryNova"));
  const [paymentMethod, setPaymentMethod] = useState(t("paymentCod"));
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [novaPoshtaType, setNovaPoshtaType] = useState(t("pickupDepartment"));
  const [novaPoshtaBranch, setNovaPoshtaBranch] = useState("");
  const [courierAddress, setCourierAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [loading, setLoading] = useState(false);

  function handleCartQuantityInput(productId: string, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      setCartQuantity(productId, 1);
      return;
    }
    setCartQuantity(productId, Math.max(1, Number(digits)));
  }

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }

    setError("");
    setMessage("");

    const nextFieldErrors = validateCheckoutForm(
      {
        customerName,
        phone,
        email,
        region,
        city,
        deliveryMethod,
        novaPoshtaBranch,
        courierAddress
      },
      t
    );

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

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
        novaPoshtaType: [t("deliveryNova"), t("deliveryUkr"), t("deliveryMeest")].includes(deliveryMethod)
          ? novaPoshtaType
          : "",
        novaPoshtaBranch: [t("deliveryNova"), t("deliveryUkr"), t("deliveryMeest")].includes(deliveryMethod)
          ? novaPoshtaBranch
          : "",
        courierAddress: deliveryMethod === t("deliveryCourier") ? courierAddress : "",
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? t("orderError"));
      setLoading(false);
      return;
    }

    clearCart();
    setMessage(t("ordered"));
    setCustomerName("");
    setPhone("");
    setEmail("");
    setComment("");
    setRegion("");
    setCity("");
    setNovaPoshtaType(t("pickupDepartment"));
    setNovaPoshtaBranch("");
    setCourierAddress("");
    setFieldErrors({});
    setLoading(false);
  }

  return (
    <main className="page section container twoColumn">
      <section className="panel">
        <h1>{t("cartTitle")}</h1>
        {items.length === 0 ? <p>{t("cartEmpty")}</p> : null}
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="cartItem">
            <img src={product.image} alt={product.name} className="miniThumb plainImage" />
            <div>
              <strong>{product.name}</strong>
              <p>{product.price} грн</p>
              <div className="cartQuantityRow">
                <button type="button" className="button secondary compactButton" onClick={() => decrementCartItem(product.id)}>
                  -
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(quantity)}
                  onChange={(event) => handleCartQuantityInput(product.id, event.target.value)}
                  onBlur={(event) => handleCartQuantityInput(product.id, event.target.value)}
                  className="cartQuantityInput"
                  aria-label={`Количество товара ${product.name}`}
                />
                <button type="button" className="button secondary compactButton" onClick={() => addToCart(product.id, 1)}>
                  +
                </button>
              </div>
              <p>{t("total")}: {(product.price * quantity).toFixed(2)} грн</p>
            </div>
            <button type="button" className="button secondary compactButton" onClick={() => removeFromCart(product.id)}>
              {t("remove")}
            </button>
          </div>
        ))}
      </section>
      <aside className="panel">
        <h2>{t("total")}</h2>
        <div className="metaLine">
          <span>{items.reduce((sum, item) => sum + item.quantity, 0)} {t("pieces")}</span>
          <strong>{total.toFixed(2)} грн</strong>
        </div>
        <form className="formGrid topGap" onSubmit={handleCheckout} noValidate>
          <div>
            <input value={customerName} onChange={(event) => { setCustomerName(event.target.value); clearFieldError(setFieldErrors, "customerName"); }} type="text" placeholder={t("name")} />
            {fieldErrors.customerName ? <p className="errorText">{fieldErrors.customerName}</p> : null}
          </div>
          <div>
            <input
              value={phone}
              onFocus={() => {
                if (!phone.trim()) {
                  setPhone("+380");
                }
              }}
              onChange={(event) => {
                setPhone(formatUkrainianPhone(event.target.value));
                clearFieldError(setFieldErrors, "phone");
              }}
              type="text"
              inputMode="tel"
              placeholder="+380 XX XXX XX XX"
            />
            {fieldErrors.phone ? <p className="errorText">{fieldErrors.phone}</p> : null}
          </div>
          <div>
            <input value={email} onChange={(event) => { setEmail(event.target.value); clearFieldError(setFieldErrors, "email"); }} type="text" inputMode="email" placeholder={t("email")} />
            {fieldErrors.email ? <p className="errorText">{fieldErrors.email}</p> : null}
          </div>
          <select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)}>
            <option value={t("deliveryNova")}>{t("deliveryNova")}</option>
            <option value={t("deliveryMeest")}>{t("deliveryMeest")}</option>
            <option value={t("deliveryUkr")}>{t("deliveryUkr")}</option>
            <option value={t("deliveryCourier")}>{t("deliveryCourier")}</option>
            <option value={t("deliveryPickup")}>{t("deliveryPickup")}</option>
          </select>
          <div>
            <input value={region} onChange={(event) => { setRegion(event.target.value); clearFieldError(setFieldErrors, "region"); }} type="text" placeholder={t("region")} />
            {fieldErrors.region ? <p className="errorText">{fieldErrors.region}</p> : null}
          </div>
          <div>
            <input value={city} onChange={(event) => { setCity(event.target.value); clearFieldError(setFieldErrors, "city"); }} type="text" placeholder={t("city")} />
            {fieldErrors.city ? <p className="errorText">{fieldErrors.city}</p> : null}
          </div>
          {[t("deliveryNova"), t("deliveryUkr"), t("deliveryMeest")].includes(deliveryMethod) ? (
            <>
              <select value={novaPoshtaType} onChange={(event) => setNovaPoshtaType(event.target.value)}>
                <option value={t("pickupDepartment")}>{t("pickupDepartment")}</option>
                <option value={t("pickupLocker")}>{t("pickupLocker")}</option>
              </select>
              <div>
                <input value={novaPoshtaBranch} onChange={(event) => { setNovaPoshtaBranch(event.target.value); clearFieldError(setFieldErrors, "novaPoshtaBranch"); }} type="text" placeholder={t("pickupPoint")} />
                {fieldErrors.novaPoshtaBranch ? <p className="errorText">{fieldErrors.novaPoshtaBranch}</p> : null}
              </div>
            </>
          ) : null}
          {deliveryMethod === t("deliveryCourier") ? (
            <div>
              <input value={courierAddress} onChange={(event) => { setCourierAddress(event.target.value); clearFieldError(setFieldErrors, "courierAddress"); }} type="text" placeholder={t("courierAddress")} />
              {fieldErrors.courierAddress ? <p className="errorText">{fieldErrors.courierAddress}</p> : null}
            </div>
          ) : null}
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value={t("paymentCod")}>{t("paymentCod")}</option>
            <option value={t("paymentCard")}>{t("paymentCard")}</option>
            <option value={t("paymentWire")}>{t("paymentWire")}</option>
          </select>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} placeholder={t("comment")} />
          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}
          <button type="submit" className="button primary full" disabled={items.length === 0 || loading}>
            {loading ? t("sending") : t("checkout")}
          </button>
        </form>
      </aside>
    </main>
  );
}

export function FavoritesClientView({ products }: { products: StoreProduct[] }) {
  const t = useTranslations("Cart");
  const { favoriteIds } = useShopState();
  const items = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <main className="page section container">
      <div className="sectionHeading compact">
        <span className="eyebrow">{t("favoritesEyebrow")}</span>
        <h1>{t("favoritesTitle")}</h1>
      </div>
      {items.length === 0 ? (
        <div className="panel">
          <p>{t("favoritesEmpty")}</p>
        </div>
      ) : null}
      <div className="productGrid">
        {items.map((product) => (
          <article key={product.id} className="productCard">
            <img src={product.image} alt={product.name} className="cardImage plainImage" />
            <div className="cardBody">
              <div className="metaLine">
                <span>{product.category}</span>
                <span>{product.badge ?? t("inCart")}</span>
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="metaLine">
                <strong>{product.price} грн</strong>
                <Link href={`/product/${product.slug}`}>Подробнее</Link>
              </div>
              <ProductCardActions product={product} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function validateCheckoutForm(
  input: {
    customerName: string;
    phone: string;
    email: string;
    region: string;
    city: string;
    deliveryMethod: string;
    novaPoshtaBranch: string;
    courierAddress: string;
  },
  t: ReturnType<typeof useTranslations>
) {
  const errors: CheckoutFieldErrors = {};
  const digitsOnly = input.phone.replace(/\D/g, "");
  const normalizedEmail = input.email.trim();

  if (!input.customerName.trim()) {
    errors.customerName = t("recipientRequired");
  }

  if (!input.phone.trim()) {
    errors.phone = t("phoneRequired");
  } else if (digitsOnly.length !== 12 || !digitsOnly.startsWith("380")) {
    errors.phone = t("phoneInvalid");
  }

  if (!normalizedEmail) {
    errors.email = t("emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
    errors.email = t("emailInvalid");
  }

  if (!input.region.trim()) {
    errors.region = t("regionRequired");
  }

  if (!input.city.trim()) {
    errors.city = t("cityRequired");
  }

  if ([t("deliveryNova"), t("deliveryUkr"), t("deliveryMeest")].includes(input.deliveryMethod) && !input.novaPoshtaBranch.trim()) {
    errors.novaPoshtaBranch = t("pickupRequired");
  }

  if (input.deliveryMethod === t("deliveryCourier") && !input.courierAddress.trim()) {
    errors.courierAddress = t("courierRequired");
  }

  return errors;
}

function clearFieldError(
  setFieldErrors: Dispatch<SetStateAction<CheckoutFieldErrors>>,
  field: keyof CheckoutFieldErrors
) {
  setFieldErrors((current) => ({ ...current, [field]: undefined }));
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

  if (country) {
    result = `+${country}`;
  }
  if (code) {
    result += ` ${code}`;
  }
  if (part1) {
    result += ` ${part1}`;
  }
  if (part2) {
    result += ` ${part2}`;
  }
  if (part3) {
    result += ` ${part3}`;
  }

  return result.trim();
}
