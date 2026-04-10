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

export function AdminProductFormV2({
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
  const [isSlugManual, setIsSlugManual] = useState(Boolean(product?.slug && product.slug !== initialGeneratedSlug));
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
    setMessage("Изображение загружено.");
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

    setMessage(product ? "Товар обновлен." : "Товар создан.");
    if (!product && submitMode === "continue") {
      setForm(EMPTY_PRODUCT_FORM);
      setNewCategory("");
      setNewBrand("");
      setIsSlugManual(false);
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
          <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} type="text" placeholder="Название товара" required />
          <input value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} type="text" placeholder="Slug" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} placeholder="Описание" />
          <div className="splitGrid">
            <input value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} type="number" placeholder="Цена" required />
            <input value={form.oldPrice ?? ""} onChange={(e) => setForm({ ...form, oldPrice: e.target.value ? Number(e.target.value) : null })} type="number" placeholder="Старая цена" />
          </div>
          <div className="splitGrid">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} type="number" placeholder="Остаток" required />
          </div>
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} type="text" placeholder="Или добавьте новую категорию" />
          <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
            <option value="">Выберите бренд</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} type="text" placeholder="Или добавьте новый бренд" />
          <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} type="text" placeholder="Размер" />
          <input value={form.centimeters} onChange={(e) => setForm({ ...form, centimeters: e.target.value })} type="text" placeholder="Сантиметры" />
          <input value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} type="text" placeholder="Возраст" />
          <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} type="text" placeholder="Для кого подходит" />
          <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} type="text" placeholder="Сезон" />
        </div>
        <div className="panel formGrid">
          <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} type="text" placeholder="Материал" />
          <textarea value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} rows={4} placeholder="Цвета, каждый с новой строки" />
          <input value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} type="text" placeholder="Бейдж" />
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} type="url" placeholder="URL изображения" />
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageUpload} />
          <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={8} placeholder="Характеристики, каждая с новой строки" />
          <p className="helperText">Если фото не загружено, будет использовано стандартное изображение: {form.image || DEFAULT_PRODUCT_IMAGE}</p>
          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}
          <button type="submit" className="button primary" disabled={loading || uploading}>
            {loading ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </section>
  );
}
