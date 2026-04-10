"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import type { AdminProduct } from "@/components/admin-ui";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-defaults";
import { slugify } from "@/lib/slug";

type ProductPayload = {
  name: string;
  slug: string;
  category: string;
  brand: string;
  size: string;
  centimeters: string;
  ageGroup: string;
  audience: string;
  season: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  material: string;
  colors: string;
  badge: string | null;
  description: string;
  image: string;
  features: string;
};

type SubmitMode = "save" | "continue";

const EMPTY_PRODUCT_FORM: ProductPayload = {
  name: "",
  slug: "",
  category: "",
  brand: "",
  size: "",
  centimeters: "",
  ageGroup: "",
  audience: "",
  season: "",
  price: 0,
  oldPrice: null,
  stock: 0,
  material: "",
  colors: "",
  badge: "",
  description: "",
  image: DEFAULT_PRODUCT_IMAGE,
  features: ""
};

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="formField">
      <span>{label}</span>
      {hint ? <small className="helperText">{hint}</small> : null}
      {children}
    </label>
  );
}

export function AdminProductFormV4({
  product,
  categories,
  brands
}: {
  product: AdminProduct | null;
  categories: string[];
  brands: string[];
}) {
  const router = useRouter();
  const initialGeneratedSlug = product?.name ? slugify(product.name) : "";
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(
    Boolean(product?.slug && product.slug !== initialGeneratedSlug)
  );
  const [form, setForm] = useState<ProductPayload>({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category: product?.category ?? "",
    brand: product?.brand ?? "",
    size: product?.size ?? "",
    centimeters: product?.centimeters ?? "",
    ageGroup: product?.ageGroup ?? "",
    audience: product?.audience ?? "",
    season: product?.season ?? "",
    price: product?.price ?? 0,
    oldPrice: product?.oldPrice ?? null,
    stock: product?.stock ?? 0,
    material: product?.material ?? "",
    colors: product?.colors.join("\n") ?? "",
    badge: product?.badge ?? "",
    description: product?.description ?? "",
    image: product?.image ?? DEFAULT_PRODUCT_IMAGE,
    features: product?.features.join("\n") ?? ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("save");

  function resetCreateForm() {
    setForm(EMPTY_PRODUCT_FORM);
    setNewCategory("");
    setNewBrand("");
    setIsSlugManual(false);
  }

  function handleNameChange(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: isSlugManual ? current.slug : slugify(name)
    }));
  }

  function handleSlugChange(slug: string) {
    setIsSlugManual(true);
    setForm((current) => ({
      ...current,
      slug: slugify(slug)
    }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось загрузить изображение.");
      setUploading(false);
      return;
    }

    setForm((current) => ({
      ...current,
      image: data.url
    }));
    setMessage("Изображение загружено. URL подставлен автоматически.");
    setUploading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const resolvedCategory = newCategory.trim() || form.category;
    const resolvedBrand = newBrand.trim() || form.brand;

    if (!resolvedCategory) {
      setError("Выберите категорию или создайте новую.");
      setLoading(false);
      return;
    }

    if (!resolvedBrand) {
      setError("Выберите бренд или создайте новый.");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      category: resolvedCategory,
      brand: resolvedBrand,
      oldPrice: form.oldPrice || null,
      badge: form.badge || null,
      features: form.features
    };

    const method = product ? "PATCH" : "POST";
    const url = product ? `/api/products/${product.id}` : "/api/products";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить товар.");
      setLoading(false);
      return;
    }

    if (product) {
      setMessage("Товар обновлен.");
    } else if (submitMode === "continue") {
      resetCreateForm();
      setMessage("Товар создан. Можно сразу добавить следующий.");
    } else {
      resetCreateForm();
      setMessage("Товар создан.");
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Продукт</span>
          <h1>Страница создания и редактирования позиции</h1>
        </div>
        <LogoutButton />
      </div>

      <form className="editorGrid" onSubmit={handleSubmit}>
        <div className="panel formGrid">
          <Field label="Название товара" hint="Название, которое увидит клиент в каталоге и карточке товара.">
            <input
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              type="text"
              placeholder="Например: Кроссовки Run Air"
              required
            />
          </Field>

          <Field label="URL товара" hint="Генерируется автоматически из названия, но можно изменить вручную.">
            <input
              value={form.slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              type="text"
              placeholder="krossovki-run-air"
            />
          </Field>

          <Field label="Описание" hint="Короткое и понятное описание товара для клиента.">
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={6}
              placeholder="Опишите преимущества товара"
            />
          </Field>

          <div className="splitGrid">
            <Field label="Цена" hint="Текущая цена продажи.">
              <input
                value={form.price}
                onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                type="number"
                placeholder="0"
                required
              />
            </Field>

            <Field label="Старая цена" hint="Необязательно. Используется для отображения скидки.">
              <input
                value={form.oldPrice ?? ""}
                onChange={(event) =>
                  setForm({ ...form, oldPrice: event.target.value ? Number(event.target.value) : null })
                }
                type="number"
                placeholder="0"
              />
            </Field>
          </div>

          <div className="splitGrid">
            <Field label="Категория" hint="Выберите одну из уже созданных категорий.">
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Остаток" hint="Количество товара в наличии.">
              <input
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}
                type="number"
                placeholder="0"
                required
              />
            </Field>
          </div>

          <Field label="Новая категория" hint="Если нужной категории нет, можно создать её прямо здесь.">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              type="text"
              placeholder="Например: Детская обувь"
            />
          </Field>

          <Field label="Бренд" hint="Выберите бренд из общего списка брендов.">
            <select value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })}>
              <option value="">Выберите бренд</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Новый бренд" hint="Если бренда нет в списке, можно добавить его здесь.">
            <input
              value={newBrand}
              onChange={(event) => setNewBrand(event.target.value)}
              type="text"
              placeholder="Например: Nike"
            />
          </Field>

          <Field label="Размер" hint="Размер, диапазон размеров или размерная сетка.">
            <input
              value={form.size}
              onChange={(event) => setForm({ ...form, size: event.target.value })}
              type="text"
              placeholder="Например: S, M, L или 38-42"
            />
          </Field>

          <Field label="Сантиметры" hint="Физические размеры товара, если это важно.">
            <input
              value={form.centimeters}
              onChange={(event) => setForm({ ...form, centimeters: event.target.value })}
              type="text"
              placeholder="Например: 25 x 12 см"
            />
          </Field>

          <Field label="Возраст" hint="Возрастная группа или возрастное ограничение.">
            <input
              value={form.ageGroup}
              onChange={(event) => setForm({ ...form, ageGroup: event.target.value })}
              type="text"
              placeholder="Например: 6+"
            />
          </Field>

          <Field label="Для кого подходит" hint="Например: для женщин, мужчин, детей, унисекс.">
            <input
              value={form.audience}
              onChange={(event) => setForm({ ...form, audience: event.target.value })}
              type="text"
              placeholder="Например: Для женщин"
            />
          </Field>

          <Field label="Сезон" hint="Если товар сезонный, укажите сезон.">
            <input
              value={form.season}
              onChange={(event) => setForm({ ...form, season: event.target.value })}
              type="text"
              placeholder="Например: Лето"
            />
          </Field>
        </div>

        <div className="panel formGrid">
          <Field label="Материал" hint="Основной материал товара. Поле необязательное.">
            <input
              value={form.material}
              onChange={(event) => setForm({ ...form, material: event.target.value })}
              type="text"
              placeholder="Например: Натуральная кожа"
            />
          </Field>

          <Field label="Цвета" hint="Каждый цвет указывайте с новой строки.">
            <textarea
              value={form.colors}
              onChange={(event) => setForm({ ...form, colors: event.target.value })}
              rows={4}
              placeholder={"Белый\nЧерный\nКрасный"}
            />
          </Field>

          <Field label="Бейдж" hint="Короткая метка на карточке товара: Новинка, Хит, Sale и т.д.">
            <input
              value={form.badge ?? ""}
              onChange={(event) => setForm({ ...form, badge: event.target.value })}
              type="text"
              placeholder="Например: Новинка"
            />
          </Field>

          <Field
            label="Фото товара"
            hint="Основной способ добавить изображение. После загрузки URL подставится автоматически, вручную ничего добавлять не нужно."
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageUpload}
            />
          </Field>

          <Field
            label="URL изображения"
            hint="Необязательно. Используйте только если хотите вставить внешнюю ссылку вместо загрузки файла."
          >
            <input
              value={form.image}
              onChange={(event) => setForm({ ...form, image: event.target.value })}
              type="url"
              placeholder="https://example.com/image.jpg"
            />
          </Field>

          <Field label="Характеристики" hint="Каждую характеристику указывайте с новой строки.">
            <textarea
              value={form.features}
              onChange={(event) => setForm({ ...form, features: event.target.value })}
              rows={8}
              placeholder={"Легкий вес\nДышащий материал\nГарантия 12 месяцев"}
            />
          </Field>

          <p className="helperText">
            Текущее изображение товара: {form.image || DEFAULT_PRODUCT_IMAGE}
          </p>

          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}

          <div className="actions">
            <button
              type="submit"
              className="button primary"
              disabled={loading || uploading}
              onClick={() => setSubmitMode("save")}
            >
              {loading && submitMode === "save"
                ? "Сохраняем..."
                : product
                  ? "Сохранить изменения"
                  : "Сохранить"}
            </button>
            {!product ? (
              <button
                type="submit"
                className="button secondary"
                disabled={loading || uploading}
                onClick={() => setSubmitMode("continue")}
              >
                {loading && submitMode === "continue"
                  ? "Сохраняем..."
                  : "Сохранить и продолжить"}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  );
}
