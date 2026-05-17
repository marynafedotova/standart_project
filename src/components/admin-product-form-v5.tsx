"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { LogoutButton } from "@/components/admin-forms";
import type { AdminProduct } from "@/components/admin-ui";
import { parseMultiValue } from "@/lib/multi-value";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-defaults";
import { slugify } from "@/lib/slug";

type TranslationMap = {
  uk: string;
  ru: string;
  en: string;
};

type ProductPayload = {
  name: string;
  code: string;
  group: string;
  variantColor: string;
  nameI18n: TranslationMap;
  slug: string;
  status: string;
  category: string[];
  brand: string;
  size: string;
  sizes: string[];
  centimeters: string;
  ageGroup: string;
  audience: string;
  season: string[];
  price: number;
  oldPrice: number | null;
  stock: number;
  warehouseStock: Array<{
    warehouse: string;
    quantity: number;
  }>;
  material: string;
  materials: string[];
  colors: string[];
  badge: string | null;
  description: string;
  descriptionI18n: TranslationMap;
  image: string;
  images: string[];
  features: string;
};

type SubmitMode = "save" | "continue";
type LocaleTab = "uk" | "ru" | "en";

const EMPTY_TRANSLATIONS: TranslationMap = { uk: "", ru: "", en: "" };

const EMPTY_PRODUCT_FORM: ProductPayload = {
  name: "",
  code: "",
  group: "",
  variantColor: "",
  nameI18n: EMPTY_TRANSLATIONS,
  slug: "",
  status: "Активний",
  category: [],
  brand: "",
  size: "",
  sizes: [],
  centimeters: "",
  ageGroup: "",
  audience: "",
  season: [],
  price: 0,
  oldPrice: null,
  stock: 0,
  warehouseStock: [],
  material: "",
  materials: [],
  colors: [],
  badge: "",
  description: "",
  descriptionI18n: EMPTY_TRANSLATIONS,
  image: DEFAULT_PRODUCT_IMAGE,
  images: [],
  features: ""
};

function Field({ label, hint, required = false, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className={`formField${required ? " requiredField" : ""}`}>
      <span>
        {label}
        {required ? <strong className="requiredMark">*</strong> : null}
      </span>
      {hint ? <small className="helperText">{hint}</small> : null}
      {children}
    </label>
  );
}

function Section({
  title,
  description,
  summary,
  children,
  defaultOpen = true
}: {
  title: string;
  description: string;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="panel formGrid adminSectionCollapse" open={defaultOpen}>
      <summary className="sectionHeading compact adminSectionSummary">
        <div className="adminSectionSummaryContent">
          <span className="eyebrow">{title}</span>
          <p>{description}</p>
          {summary ? <small className="helperText adminSectionSummaryMeta">{summary}</small> : null}
        </div>
      </summary>
      <div className="adminSectionBody">{children}</div>
    </details>
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
      <small className="helperText">{selected.length > 0 ? `Вибрано: ${selected.join(", ")}` : "Поки нічого не вибрано."}</small>
    </Field>
  );
}

function TranslationTabs({
  activeLocale,
  onChange,
  title,
  description,
  nameValue,
  namePlaceholder,
  descriptionValue,
  descriptionPlaceholder,
  onNameChange,
  onDescriptionChange
}: {
  activeLocale: LocaleTab;
  onChange: (locale: LocaleTab) => void;
  title: string;
  description: string;
  nameValue: string;
  namePlaceholder: string;
  descriptionValue: string;
  descriptionPlaceholder: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}) {
  const tabs: Array<{ value: LocaleTab; label: string }> = [
    { value: "uk", label: "UA" },
    { value: "ru", label: "RU" },
    { value: "en", label: "EN" }
  ];

  return (
    <div className="formField" style={{ gridColumn: "1 / -1" }}>
      <span>{title}</span>
      <small className="helperText">{description}</small>
      <div className="chips adminMultiChips" style={{ marginBottom: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`chip ${activeLocale === tab.value ? "active" : ""}`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="splitGrid">
        <Field label={`Назва ${activeLocale.toUpperCase()}`}>
          <input value={nameValue} onChange={(event) => onNameChange(event.target.value)} type="text" placeholder={namePlaceholder} />
        </Field>
        <Field label={`Опис ${activeLocale.toUpperCase()}`}>
          <textarea
            value={descriptionValue}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={5}
            placeholder={descriptionPlaceholder}
          />
        </Field>
      </div>
    </div>
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
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseNullableNonNegativeNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

async function parseResponseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as { error?: string } | null;
  } catch {
    return null;
  }
}

export function AdminProductFormV5({
  product,
  categories,
  brands,
  seasons,
  warehouses,
  groups,
  colors,
  sizes,
  materials
}: {
  product: AdminProduct | null;
  categories: string[];
  brands: string[];
  seasons: string[];
  warehouses: string[];
  groups: string[];
  colors: string[];
  sizes: string[];
  materials: string[];
}) {
  const router = useRouter();
  const initialGeneratedSlug = product?.name ? slugify(product.name) : "";
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newSeason, setNewSeason] = useState("");
  const [availableWarehouses] = useState(warehouses);
  const [availableGroups] = useState(groups);
  const [warehouseToAdd, setWarehouseToAdd] = useState("");
  const [activeLocale, setActiveLocale] = useState<LocaleTab>("uk");
  const [isSlugManual, setIsSlugManual] = useState(Boolean(product?.slug && product.slug !== initialGeneratedSlug));
  const [form, setForm] = useState<ProductPayload>({
    name: product?.name ?? "",
    code: product?.code ?? "",
    group: product?.group ?? "",
    variantColor: product?.variantColor ?? "",
    nameI18n: {
      uk: product?.nameI18n?.uk ?? "",
      ru: product?.nameI18n?.ru ?? "",
      en: product?.nameI18n?.en ?? ""
    },
    slug: product?.slug ?? "",
    status: product?.status ?? "Активний",
    category: parseMultiValue(product?.category),
    brand: product?.brand ?? "",
    size: product?.size ?? "",
    sizes: product?.sizes ?? parseMultiValue(product?.size),
    centimeters: product?.centimeters ?? "",
    ageGroup: product?.ageGroup ?? "",
    audience: product?.audience ?? "",
    season: parseMultiValue(product?.season),
    price: product?.price ?? 0,
    oldPrice: product?.oldPrice ?? null,
    stock: product?.stock ?? 0,
    warehouseStock:
      product?.warehouseStock
        ?.map((entry) => ({ warehouse: entry.warehouse, quantity: Math.max(0, Math.trunc(entry.quantity)) }))
        .filter((entry) => entry.warehouse.trim().length > 0) ?? [],
    material: product?.material ?? "",
    materials: product?.materials ?? (product?.material ? product.material.split(",").map((item) => item.trim()).filter(Boolean) : []),
    colors: product?.colors ?? [],
    badge: product?.badge ?? "",
    description: product?.description ?? "",
    descriptionI18n: {
      uk: product?.descriptionI18n?.uk ?? "",
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
  const variantSummary =
    form.group.trim() || form.variantColor.trim()
      ? `Група: ${form.group.trim() || "не вказана"} · Колір: ${form.variantColor.trim() || "не вказаний"}`
      : "Не використовується, якщо товар не має кольорових варіантів.";

  function resetCreateForm() {
    setForm(EMPTY_PRODUCT_FORM);
    setNewCategory("");
    setNewBrand("");
    setNewSeason("");
    setWarehouseToAdd("");
    setIsSlugManual(false);
    setActiveLocale("uk");
  }

  function normalizeWarehouseStock(entries: Array<{ warehouse: string; quantity: number }>) {
    const grouped = new Map<string, number>();
    for (const entry of entries) {
      const warehouse = entry.warehouse.trim();
      const quantity = Math.max(0, Math.trunc(entry.quantity));
      if (!warehouse) continue;
      grouped.set(warehouse, (grouped.get(warehouse) ?? 0) + quantity);
    }
    return Array.from(grouped.entries()).map(([warehouse, quantity]) => ({ warehouse, quantity }));
  }

  function syncWarehouseStock(entries: Array<{ warehouse: string; quantity: number }>) {
    const warehouseStock = normalizeWarehouseStock(entries);
    setForm((current) => ({
      ...current,
      warehouseStock,
      stock: warehouseStock.reduce((sum, entry) => sum + entry.quantity, 0)
    }));
  }

  function toggleSelection(field: "category" | "season" | "colors" | "sizes" | "materials", value: string) {
    setForm((current) => {
      const next = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value];

      return {
        ...current,
        [field]: next,
        ...(field === "sizes" ? { size: next.join(" | ") } : null),
        ...(field === "materials" ? { material: next.join(", ") } : null)
      };
    });
  }

  function handleNameChange(name: string) {
    setForm((current) => ({ ...current, name, slug: isSlugManual ? current.slug : slugify(name) }));
  }

  function handleSlugChange(slug: string) {
    setIsSlugManual(true);
    setForm((current) => ({ ...current, slug: slugify(slug) }));
  }

  function updateTranslation(field: "nameI18n" | "descriptionI18n", locale: LocaleTab, value: string) {
    setForm((current) => ({
      ...current,
      [field]: {
        ...current[field],
        [locale]: value
      }
    }));
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
          setError(data.error ?? "Не вдалося завантажити зображення.");
          return;
        }
        uploadedUrls.push(data.url);
      }

      setForm((current) => {
        const gallery = uniqueImages([
          ...uploadedUrls,
          ...current.images,
          ...(current.image && current.image !== DEFAULT_PRODUCT_IMAGE ? [current.image] : [])
        ]);
        return { ...current, image: gallery[0] ?? DEFAULT_PRODUCT_IMAGE, images: gallery };
      });

      setMessage(
        uploadedUrls.length === 1
          ? "Зображення завантажено та додано до галереї."
          : `Завантажено ${uploadedUrls.length} зображень і додано до галереї.`
      );
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
    const resolvedWarehouseStock = normalizeWarehouseStock(form.warehouseStock);
    const resolvedSizes = uniqueValues(form.sizes);
    const resolvedMaterials = uniqueValues(form.materials);
    const resolvedColors = uniqueValues(form.colors);

    if (resolvedCategories.length === 0) {
      setError("Виберіть хоча б одну категорію або додайте нову.");
      setLoading(false);
      return;
    }

    if (!resolvedBrand) {
      setError("Виберіть бренд або створіть новий.");
      setLoading(false);
      return;
    }

    const resolvedImages = uniqueImages([form.image || DEFAULT_PRODUCT_IMAGE, ...form.images]);
    const payload = {
      ...form,
      stock: resolvedWarehouseStock.reduce((sum, entry) => sum + entry.quantity, 0),
      warehouseStock: resolvedWarehouseStock,
      image: resolvedImages[0] ?? DEFAULT_PRODUCT_IMAGE,
      images: resolvedImages,
      category: resolvedCategories,
      brand: resolvedBrand,
      season: resolvedSeasons,
      sizes: resolvedSizes,
      size: resolvedSizes.join(" | "),
      materials: resolvedMaterials,
      material: resolvedMaterials.join(", "),
      colors: resolvedColors,
      nameI18n: Object.fromEntries(Object.entries(form.nameI18n).map(([key, value]) => [key, value.trim()])),
      oldPrice: form.oldPrice || null,
      badge: form.badge || null,
      descriptionI18n: Object.fromEntries(Object.entries(form.descriptionI18n).map(([key, value]) => [key, value.trim()])),
      features: form.features
    };

    const method = product ? "PATCH" : "POST";
    const url = product ? `/api/products/${product.id}` : "/api/products";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await parseResponseJson(response);

    if (!response.ok) {
      setError(data?.error ?? "Не вдалося зберегти товар.");
      setLoading(false);
      return;
    }

    if (product) {
      setMessage("Товар оновлено.");
    } else if (submitMode === "continue") {
      resetCreateForm();
      setMessage("Товар створено. Можна одразу додати наступний.");
    } else {
      resetCreateForm();
      setMessage("Товар створено.");
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Товар</span>
          <h1>Створення та редагування товару</h1>
        </div>
        <LogoutButton />
      </div>

      <form className="editorGrid compactAdminCard productEditorLayout" onSubmit={handleSubmit}>
        <Section title="Основне" description="Базова інформація про товар, яку побачить клієнт." summary={variantSummary} defaultOpen>
          <Field label="Назва товару" hint="Основна назва за замовчуванням.">
            <input className="requiredInput" value={form.name} onChange={(event) => handleNameChange(event.target.value)} type="text" required />
          </Field>

          <Field label="Код товару" hint="Внутрішній код для пошуку та обліку.">
            <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} type="text" />
          </Field>

          <div className="panel adminInlineNote" style={{ gridColumn: "1 / -1" }}>
            <strong>Як це працює:</strong> поле "Група товару" об'єднує один товар у різних кольорах, а "Колір варіанту" задає назву конкретного кольору для перемикача. Якщо кольорових варіантів немає, обидва поля можна залишити порожніми.
          </div>

          <div className="splitGrid">
            <Field label="Група товару" hint="Пов'язує один товар у різних кольорах.">
              <>
                <input value={form.group} onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))} type="text" list="product-groups" />
                <datalist id="product-groups">
                  {availableGroups.map((group) => (
                    <option key={group} value={group} />
                  ))}
                </datalist>
              </>
            </Field>

            <Field label="Колір варіанту" hint="Підпис для перемикача варіантів.">
              <input value={form.variantColor} onChange={(event) => setForm((current) => ({ ...current, variantColor: event.target.value }))} type="text" />
            </Field>
          </div>

          <Field label="URL товару" hint="Генерується автоматично, але можна змінити вручну.">
            <input value={form.slug} onChange={(event) => handleSlugChange(event.target.value)} type="text" />
          </Field>

          <Field label="Опис" hint="Основний текст за замовчуванням.">
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={6} />
          </Field>

          <TranslationTabs
            activeLocale={activeLocale}
            onChange={setActiveLocale}
            title="Переклади"
            description="Для картки товару доступні окремі вкладки з перекладами UA, RU та EN."
            nameValue={form.nameI18n[activeLocale]}
            namePlaceholder="Перекладена назва"
            descriptionValue={form.descriptionI18n[activeLocale]}
            descriptionPlaceholder="Перекладений опис"
            onNameChange={(value) => updateTranslation("nameI18n", activeLocale, value)}
            onDescriptionChange={(value) => updateTranslation("descriptionI18n", activeLocale, value)}
          />

          <div className="splitGrid">
            <Field label="Ціна">
              <input className="requiredInput" value={form.price === 0 ? "" : String(form.price)} onChange={(event) => setForm((current) => ({ ...current, price: parseNonNegativeNumber(event.target.value) }))} type="text" inputMode="decimal" required />
            </Field>

            <Field label="Стара ціна">
              <input value={form.oldPrice ?? ""} onChange={(event) => setForm((current) => ({ ...current, oldPrice: parseNullableNonNegativeNumber(event.target.value) }))} type="text" inputMode="decimal" />
            </Field>
          </div>

          <div className="splitGrid">
            <Field label="Статус">
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="Активний">Активний</option>
                <option value="Чернетка">Чернетка</option>
                <option value="Немає в наявності">Немає в наявності</option>
                <option value="Брак">Брак</option>
              </select>
            </Field>

            <Field label="Загальний залишок" hint="Рахується автоматично як сума по складах.">
              <input value={String(form.stock)} type="text" readOnly />
            </Field>
          </div>

          <MultiSelectField
            label="Категорії"
            hint="Можна вибрати одразу кілька категорій."
            values={categories}
            selected={form.category}
            onToggle={(value) => toggleSelection("category", value)}
            emptyLabel="Спочатку додайте категорії в довідник."
          />

          <Field label="Нова категорія">
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} type="text" />
          </Field>

          <Field label="Бренд">
            <select className="requiredInput" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}>
              <option value="">Виберіть бренд</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Новий бренд">
            <input value={newBrand} onChange={(event) => setNewBrand(event.target.value)} type="text" />
          </Field>
        </Section>

        <Section title="Характеристики" description="Параметри товару для фільтрів, картки й каталогу." defaultOpen={Boolean(product)}>
          <MultiSelectField
            label="Розміри"
            hint="Розміри вибираються з окремого довідника."
            values={sizes}
            selected={form.sizes}
            onToggle={(value) => toggleSelection("sizes", value)}
            emptyLabel="Спочатку додайте розміри в довідник."
          />
          <MultiSelectField
            label="Матеріали"
            hint="Матеріали вибираються із загального довідника."
            values={materials}
            selected={form.materials}
            onToggle={(value) => toggleSelection("materials", value)}
            emptyLabel="Спочатку додайте матеріали в довідник."
          />
          <MultiSelectField
            label="Кольори"
            hint="Кольори вибираються множинно із загального довідника."
            values={colors}
            selected={form.colors}
            onToggle={(value) => toggleSelection("colors", value)}
            emptyLabel="Спочатку додайте кольори в довідник."
          />

          <Field label="Сантиметри">
            <input value={form.centimeters} onChange={(event) => setForm((current) => ({ ...current, centimeters: event.target.value }))} type="text" />
          </Field>
          <Field label="Вікова група">
            <input value={form.ageGroup} onChange={(event) => setForm((current) => ({ ...current, ageGroup: event.target.value }))} type="text" />
          </Field>
          <Field label="Для кого">
            <input value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))} type="text" />
          </Field>

          <MultiSelectField
            label="Сезони"
            hint="Можна вибрати кілька сезонів для одного товару."
            values={seasons}
            selected={form.season}
            onToggle={(value) => toggleSelection("season", value)}
            emptyLabel="Спочатку додайте сезони в довідник."
          />

          <Field label="Новий сезон">
            <input value={newSeason} onChange={(event) => setNewSeason(event.target.value)} type="text" />
          </Field>

          <Field label="Бейдж">
            <input value={form.badge ?? ""} onChange={(event) => setForm((current) => ({ ...current, badge: event.target.value }))} type="text" />
          </Field>

          <Field label="Характеристики" hint="Кожну характеристику вказуйте з нового рядка.">
            <textarea value={form.features} onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))} rows={8} />
          </Field>
        </Section>

        <Section title="Склади" description="Виберіть склади розміщення товару та задайте кількість по кожному." defaultOpen={Boolean(product?.warehouseStock?.length)}>
          <Field label="Додати склад" hint="Можна вибрати лише існуючий склад із довідника.">
            <div className="actions">
              <select value={warehouseToAdd} onChange={(event) => setWarehouseToAdd(event.target.value)}>
                <option value="">Виберіть склад</option>
                {availableWarehouses
                  .filter((warehouse) => !form.warehouseStock.some((entry) => entry.warehouse === warehouse))
                  .map((warehouse) => (
                    <option key={warehouse} value={warehouse}>
                      {warehouse}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  if (!warehouseToAdd) return;
                  syncWarehouseStock([...form.warehouseStock, { warehouse: warehouseToAdd, quantity: 0 }]);
                  setWarehouseToAdd("");
                }}
              >
                Додати
              </button>
            </div>
          </Field>

          <div className="panel tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Склад</th>
                  <th>Кількість</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {form.warehouseStock.map((entry) => (
                  <tr key={entry.warehouse}>
                    <td>{entry.warehouse}</td>
                    <td>
                      <input
                        value={String(entry.quantity)}
                        onChange={(event) =>
                          syncWarehouseStock(
                            form.warehouseStock.map((item) =>
                              item.warehouse === entry.warehouse
                                ? { ...item, quantity: Math.max(0, Math.trunc(parseNonNegativeNumber(event.target.value))) }
                                : item
                            )
                          )
                        }
                        type="text"
                        inputMode="numeric"
                      />
                    </td>
                    <td>
                      <button type="button" className="button secondary" onClick={() => syncWarehouseStock(form.warehouseStock.filter((item) => item.warehouse !== entry.warehouse))}>
                        Прибрати
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {form.warehouseStock.length === 0 ? <p>У товару поки немає складів. Додайте хоча б один склад.</p> : null}
          </div>
        </Section>

        <Section title="Зображення" description="Завантажте кілька фото товару або вставте посилання вручну." defaultOpen={!product}>
          <Field label="Фото товару">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={handleImageUpload} />
          </Field>

          <Field label="Основне зображення">
            <input value={form.image} onChange={(event) => setPrimaryImage(event.target.value)} type="text" />
          </Field>

          <Field label="Галерея товару">
            <textarea value={form.images.join("\n")} onChange={(event) => setGallery(event.target.value.split("\n"))} rows={6} />
          </Field>

          {form.images.length > 0 ? (
            <div className="productGalleryThumbs adminGalleryThumbs">
              {form.images.map((image, index) => (
                <button key={`${image}-${index}`} type="button" className={`galleryThumbButton${image === form.image ? " active" : ""}`} onClick={() => setPrimaryImage(image)} aria-label={`Зробити основним зображення ${index + 1}`}>
                  <Image src={image} alt={`Галерея ${index + 1}`} width={120} height={120} className="galleryThumb" />
                </button>
              ))}
            </div>
          ) : null}

          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}

        </Section>

        <div className="panel adminSubmitBar">
          <div className="adminSubmitBarText">
            <span className="eyebrow">{"\u0414\u0456\u0457"}</span>
            <p>{"\u041f\u043e\u043b\u044f \u0437\u0456 \u0437\u0456\u0440\u043e\u0447\u043a\u043e\u044e \u043e\u0431\u043e\u0432'\u044f\u0437\u043a\u043e\u0432\u0456. \u041a\u043d\u043e\u043f\u043a\u0438 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0437\u0430\u0432\u0436\u0434\u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0456 \u0432 \u043d\u0438\u0436\u043d\u0456\u0439 \u043f\u0430\u043d\u0435\u043b\u0456."}</p>
          </div>
          <div className="actions">
            <button type="submit" className="button primary" disabled={loading || uploading} onClick={() => setSubmitMode("save")}>
              {loading && submitMode === "save"
                ? "\u0417\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u043c\u043e..."
                : product
                  ? "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0437\u043c\u0456\u043d\u0438"
                  : "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438"}
            </button>
            {!product ? (
              <button type="submit" className="button secondary" disabled={loading || uploading} onClick={() => setSubmitMode("continue")}>
                {loading && submitMode === "continue"
                  ? "\u0417\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u043c\u043e..."
                  : "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0456 \u043f\u0440\u043e\u0434\u043e\u0432\u0436\u0438\u0442\u0438"}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  );
}
