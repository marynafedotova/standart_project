"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { LogoutButton } from "@/components/admin-forms";
import type { AdminProduct } from "@/components/admin-ui";
import { parseMultiValue } from "@/lib/multi-value";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-defaults";
import { slugify } from "@/lib/slug";

type ProductPayload = {
  name: string;
  nameI18n: {
    ru: string;
    en: string;
  };
  slug: string;
  status: string;
  category: string[];
  brand: string;
  size: string;
  centimeters: string;
  ageGroup: string;
  audience: string;
  season: string[];
  price: number;
  oldPrice: number | null;
  stock: number;
  material: string;
  colors: string;
  badge: string | null;
  description: string;
  descriptionI18n: {
    ru: string;
    en: string;
  };
  image: string;
  images: string[];
  features: string;
};

type SubmitMode = "save" | "continue";

const EMPTY_PRODUCT_FORM: ProductPayload = {
  name: "",
  nameI18n: {
    ru: "",
    en: ""
  },
  slug: "",
  status: "Активен",
  category: [],
  brand: "",
  size: "",
  centimeters: "",
  ageGroup: "",
  audience: "",
  season: [],
  price: 0,
  oldPrice: null,
  stock: 0,
  material: "",
  colors: "",
  badge: "",
  description: "",
  descriptionI18n: {
    ru: "",
    en: ""
  },
  image: DEFAULT_PRODUCT_IMAGE,
  images: [],
  features: ""
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="formField">
      <span>{label}</span>
      {hint ? <small className="helperText">{hint}</small> : null}
      {children}
    </label>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="panel formGrid">
      <div className="sectionHeading compact">
        <span className="eyebrow">{title}</span>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function MultiSelectField({
  label,
  hint,
  values,
  selected,
  onToggle,
  emptyLabel
}: {
  label: string;
  hint?: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  emptyLabel: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="chips adminMultiChips">
        {values.length === 0 ? <span className="helperText">{emptyLabel}</span> : null}
        {values.map((value) => (
          <button
            key={value}
            type="button"
            className={`chip ${selected.includes(value) ? "active" : ""}`}
            onClick={() => onToggle(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <small className="helperText">
        {selected.length > 0 ? `Выбрано: ${selected.join(", ")}` : "Пока ничего не выбрано."}
      </small>
    </Field>
  );
}

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.map((item) => item.trim()).filter(Boolean)));
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function parseNonNegativeNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
}

function parseNullableNonNegativeNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(0, parsed);
}

export function AdminProductFormV5({
  product,
  categories,
  brands,
  seasons
}: {
  product: AdminProduct | null;
  categories: string[];
  brands: string[];
  seasons: string[];
}) {
  const router = useRouter();
  const initialGeneratedSlug = product?.name ? slugify(product.name) : "";
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newSeason, setNewSeason] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(Boolean(product?.slug && product.slug !== initialGeneratedSlug));
  const [form, setForm] = useState<ProductPayload>({
    name: product?.name ?? "",
    nameI18n: {
      ru: product?.nameI18n?.ru ?? "",
      en: product?.nameI18n?.en ?? ""
    },
    slug: product?.slug ?? "",
    status: product?.status ?? "Активен",
    category: parseMultiValue(product?.category),
    brand: product?.brand ?? "",
    size: product?.size ?? "",
    centimeters: product?.centimeters ?? "",
    ageGroup: product?.ageGroup ?? "",
    audience: product?.audience ?? "",
    season: parseMultiValue(product?.season),
    price: product?.price ?? 0,
    oldPrice: product?.oldPrice ?? null,
    stock: product?.stock ?? 0,
    material: product?.material ?? "",
    colors: product?.colors.join("\n") ?? "",
    badge: product?.badge ?? "",
    description: product?.description ?? "",
    descriptionI18n: {
      ru: product?.descriptionI18n?.ru ?? "",
      en: product?.descriptionI18n?.en ?? ""
    },
    image: product?.image ?? DEFAULT_PRODUCT_IMAGE,
    images: uniqueImages(product?.images ?? (product?.image ? [product.image] : [])),
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
    setNewSeason("");
    setIsSlugManual(false);
  }

  function handleNameChange(name: string) {
    setForm((current) => ({ ...current, name, slug: isSlugManual ? current.slug : slugify(name) }));
  }

  function handleSlugChange(slug: string) {
    setIsSlugManual(true);
    setForm((current) => ({ ...current, slug: slugify(slug) }));
  }

  function setGallery(images: string[]) {
    const nextImages = uniqueImages(images);
    setForm((current) => ({
      ...current,
      images: nextImages,
      image: nextImages[0] ?? (current.image && current.image !== DEFAULT_PRODUCT_IMAGE ? current.image : DEFAULT_PRODUCT_IMAGE)
    }));
  }

  function setPrimaryImage(image: string) {
    setForm((current) => ({ ...current, image, images: uniqueImages([image, ...current.images]) }));
  }

  function toggleSelection(field: "category" | "season", value: string) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]
    }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Не удалось загрузить изображение.");
          return;
        }
        uploadedUrls.push(data.url);
      }

      setForm((current) => {
        const gallery = uniqueImages([...uploadedUrls, ...current.images, ...(current.image && current.image !== DEFAULT_PRODUCT_IMAGE ? [current.image] : [])]);
        return { ...current, image: gallery[0] ?? DEFAULT_PRODUCT_IMAGE, images: gallery };
      });

      setMessage(uploadedUrls.length === 1 ? "Изображение загружено и добавлено в галерею." : `Загружено ${uploadedUrls.length} изображений и добавлено в галерею.`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const resolvedCategories = uniqueValues([...form.category, newCategory]);
    const resolvedBrand = newBrand.trim() || form.brand;
    const resolvedSeasons = uniqueValues([...form.season, newSeason]);

    if (resolvedCategories.length === 0) {
      setError("Выберите хотя бы одну категорию или добавьте новую.");
      setLoading(false);
      return;
    }

    if (!resolvedBrand) {
      setError("Выберите бренд или создайте новый.");
      setLoading(false);
      return;
    }

    const resolvedImages = uniqueImages([form.image || DEFAULT_PRODUCT_IMAGE, ...form.images]);
    const payload = {
      ...form,
      image: resolvedImages[0] ?? DEFAULT_PRODUCT_IMAGE,
      images: resolvedImages,
      category: resolvedCategories,
      brand: resolvedBrand,
      season: resolvedSeasons,
      nameI18n: {
        ru: form.nameI18n.ru.trim(),
        en: form.nameI18n.en.trim()
      },
      oldPrice: form.oldPrice || null,
      badge: form.badge || null,
      descriptionI18n: {
        ru: form.descriptionI18n.ru.trim(),
        en: form.descriptionI18n.en.trim()
      },
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
      setMessage("Товар обновлён.");
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
        <Section title="Основное" description="Базовая информация о товаре, которую увидит клиент.">
          <Field label="Название товара" hint="Название в каталоге и карточке товара.">
            <input value={form.name} onChange={(event) => handleNameChange(event.target.value)} type="text" placeholder="Например: Кроссовки Run Air" required />
          </Field>

          <div className="splitGrid">
            <Field label="Название RU" hint="Русская версия названия для мультиязычности.">
              <input
                value={form.nameI18n.ru}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameI18n: { ...current.nameI18n, ru: event.target.value }
                  }))
                }
                type="text"
                placeholder="Название на русском"
              />
            </Field>

            <Field label="Название EN" hint="Английская версия названия для мультиязычности.">
              <input
                value={form.nameI18n.en}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameI18n: { ...current.nameI18n, en: event.target.value }
                  }))
                }
                type="text"
                placeholder="Product title in English"
              />
            </Field>
          </div>

          <Field label="URL товара" hint="Генерируется автоматически, но можно изменить вручную.">
            <input value={form.slug} onChange={(event) => handleSlugChange(event.target.value)} type="text" placeholder="krossovki-run-air" />
          </Field>

          <Field label="Описание" hint="Короткое понятное описание товара.">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={6} placeholder="Опишите товар простыми словами" />
          </Field>

          <div className="splitGrid">
            <Field label="Описание RU" hint="Русская версия описания.">
              <textarea
                value={form.descriptionI18n.ru}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descriptionI18n: { ...current.descriptionI18n, ru: event.target.value }
                  }))
                }
                rows={5}
                placeholder="Описание на русском"
              />
            </Field>

            <Field label="Описание EN" hint="Английская версия описания.">
              <textarea
                value={form.descriptionI18n.en}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descriptionI18n: { ...current.descriptionI18n, en: event.target.value }
                  }))
                }
                rows={5}
                placeholder="Product description in English"
              />
            </Field>
          </div>

          <div className="splitGrid">
            <Field label="Цена" hint="Текущая цена продажи. Можно вводить копейки через точку или запятую.">
              <input value={form.price === 0 ? "" : String(form.price)} onChange={(event) => setForm({ ...form, price: parseNonNegativeNumber(event.target.value) })} type="text" inputMode="decimal" placeholder="0.00" required />
            </Field>

            <Field label="Старая цена" hint="Необязательно. Для показа скидки.">
              <input value={form.oldPrice ?? ""} onChange={(event) => setForm({ ...form, oldPrice: parseNullableNonNegativeNumber(event.target.value) })} type="text" inputMode="decimal" placeholder="0.00" />
            </Field>
          </div>

          <div className="splitGrid">
            <Field label="Статус" hint="Управляет видимостью и состоянием товара в админке.">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="Активен">Активен</option>
                <option value="Черновик">Черновик</option>
                <option value="Нет в наличии">Нет в наличии</option>
                <option value="Брак">Брак</option>
              </select>
            </Field>

            <Field label="Остаток" hint="Количество товара в наличии.">
              <input value={form.stock === 0 ? "" : String(form.stock)} onChange={(event) => setForm({ ...form, stock: Math.trunc(parseNonNegativeNumber(event.target.value)) })} type="text" inputMode="numeric" placeholder="0" required />
            </Field>
          </div>

          <MultiSelectField
            label="Категории"
            hint="Можно выбрать сразу несколько категорий для одного товара."
            values={categories}
            selected={form.category}
            onToggle={(value) => toggleSelection("category", value)}
            emptyLabel="Сначала добавьте категории в справочник."
          />

          <Field label="Новая категория" hint="Если нужной категории нет, добавьте её здесь. Она сразу привяжется к товару.">
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} type="text" placeholder="Например: Детская обувь" />
          </Field>

          <Field label="Бренд" hint="Выберите бренд из общего списка.">
            <select value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })}>
              <option value="">Выберите бренд</option>
              {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          </Field>

          <Field label="Новый бренд" hint="Если бренда нет в списке, добавьте его здесь.">
            <input value={newBrand} onChange={(event) => setNewBrand(event.target.value)} type="text" placeholder="Например: Nike" />
          </Field>
        </Section>

        <Section title="Характеристики" description="Параметры товара для фильтров, карточки и каталога.">
          <Field label="Размер" hint="Размер, диапазон размеров или размерная сетка."><input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} type="text" placeholder="Например: S, M, L или 38-42" /></Field>
          <Field label="Сантиметры" hint="Физические размеры товара, если это важно."><input value={form.centimeters} onChange={(event) => setForm({ ...form, centimeters: event.target.value })} type="text" placeholder="Например: 25 x 12 см" /></Field>
          <Field label="Возраст" hint="Возрастная группа или ограничение по возрасту."><input value={form.ageGroup} onChange={(event) => setForm({ ...form, ageGroup: event.target.value })} type="text" placeholder="Например: 6+" /></Field>
          <Field label="Для кого подходит" hint="Например: для женщин, мужчин, детей, унисекс."><input value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} type="text" placeholder="Например: Для женщин" /></Field>

          <MultiSelectField
            label="Сезоны"
            hint="Можно выбрать несколько сезонов для одного товара."
            values={seasons}
            selected={form.season}
            onToggle={(value) => toggleSelection("season", value)}
            emptyLabel="Сначала добавьте сезоны в справочник."
          />

          <Field label="Новый сезон" hint="Если нужного сезона нет, добавьте его здесь.">
            <input value={newSeason} onChange={(event) => setNewSeason(event.target.value)} type="text" placeholder="Например: Осень" />
          </Field>
          <Field label="Материал" hint="Основной материал товара. Необязательно."><input value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} type="text" placeholder="Например: Натуральная кожа" /></Field>
          <Field label="Цвета" hint="Каждый цвет указывайте с новой строки."><textarea value={form.colors} onChange={(event) => setForm({ ...form, colors: event.target.value })} rows={4} placeholder={"Белый\nЧёрный\nКрасный"} /></Field>
          <Field label="Бейдж" hint="Короткая метка на карточке товара: Новинка, Хит, Sale и т.д."><input value={form.badge ?? ""} onChange={(event) => setForm({ ...form, badge: event.target.value })} type="text" placeholder="Например: Новинка" /></Field>
          <Field label="Характеристики" hint="Каждую характеристику указывайте с новой строки."><textarea value={form.features} onChange={(event) => setForm({ ...form, features: event.target.value })} rows={8} placeholder={"Лёгкий вес\nДышащий материал\nГарантия 12 месяцев"} /></Field>
        </Section>

        <Section title="Изображение" description="Загрузите несколько фото товара или вставьте ссылки вручную.">
          <Field label="Фото товара" hint="Можно выбрать сразу несколько изображений. Они автоматически попадут в галерею товара.">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={handleImageUpload} />
          </Field>

          <Field label="Основное изображение" hint="Используется в карточках товара и первым показывается в галерее.">
            <input value={form.image} onChange={(event) => setPrimaryImage(event.target.value)} type="text" placeholder="https://example.com/image.jpg или /uploads/file.jpg" />
          </Field>

          <Field label="Галерея товара" hint="Каждое изображение с новой строки. Можно использовать и загруженные файлы, и внешние ссылки.">
            <textarea value={form.images.join("\n")} onChange={(event) => setGallery(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} rows={6} placeholder={"/uploads/product-1.jpg\n/uploads/product-2.jpg"} />
          </Field>

          <p className="helperText">В форме оставлены только миниатюры галереи. Нажмите на нужную, чтобы сделать её основной.</p>

          {form.images.length > 0 ? (
            <div className="productGalleryThumbs adminGalleryThumbs">
              {form.images.map((image, index) => (
                <button key={`${image}-${index}`} type="button" className={`galleryThumbButton${image === form.image ? " active" : ""}`} onClick={() => setPrimaryImage(image)} aria-label={`Сделать основным изображение ${index + 1}`}>
                  <Image src={image} alt={`Галерея ${index + 1}`} width={120} height={120} className="galleryThumb" />
                </button>
              ))}
            </div>
          ) : null}

          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}

          <div className="actions">
            <button type="submit" className="button primary" disabled={loading || uploading} onClick={() => setSubmitMode("save")}>
              {loading && submitMode === "save" ? "Сохраняем..." : product ? "Сохранить изменения" : "Сохранить"}
            </button>
            {!product ? (
              <button type="submit" className="button secondary" disabled={loading || uploading} onClick={() => setSubmitMode("continue")}>
                {loading && submitMode === "continue" ? "Сохраняем..." : "Сохранить и продолжить"}
              </button>
            ) : null}
          </div>
        </Section>
      </form>
    </section>
  );
}

