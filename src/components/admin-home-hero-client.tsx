"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { LogoutButton } from "@/components/admin-forms";
import type { DbHeroSettings } from "@/lib/json-db";

type Locale = "uk" | "ru" | "en";

type FormState = {
  badge: string;
  badgeI18n: Record<Locale, string>;
  title: string;
  titleI18n: Record<Locale, string>;
  description: string;
  descriptionI18n: Record<Locale, string>;
  primaryText: string;
  primaryTextI18n: Record<Locale, string>;
  primaryLink: string;
  secondaryText: string;
  secondaryTextI18n: Record<Locale, string>;
  secondaryLink: string;
  imageSrc: string;
  imageAlt: string;
  imageAltI18n: Record<Locale, string>;
  benefits: string;
  benefitsRu: string;
  benefitsEn: string;
};

function toLocaleMap(value?: Record<string, string>): Record<Locale, string> {
  return {
    uk: value?.uk ?? "",
    ru: value?.ru ?? "",
    en: value?.en ?? ""
  };
}

function toBenefits(value?: string[]) {
  return (value ?? []).join("\n");
}

export function AdminHomeHeroClient({ initialSettings }: { initialSettings: DbHeroSettings }) {
  const [activeLocale, setActiveLocale] = useState<Locale>("uk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<FormState>({
    badge: initialSettings.badge,
    badgeI18n: toLocaleMap(initialSettings.badgeI18n),
    title: initialSettings.title,
    titleI18n: toLocaleMap(initialSettings.titleI18n),
    description: initialSettings.description,
    descriptionI18n: toLocaleMap(initialSettings.descriptionI18n),
    primaryText: initialSettings.primaryText,
    primaryTextI18n: toLocaleMap(initialSettings.primaryTextI18n),
    primaryLink: initialSettings.primaryLink,
    secondaryText: initialSettings.secondaryText,
    secondaryTextI18n: toLocaleMap(initialSettings.secondaryTextI18n),
    secondaryLink: initialSettings.secondaryLink,
    imageSrc: initialSettings.imageSrc,
    imageAlt: initialSettings.imageAlt,
    imageAltI18n: toLocaleMap(initialSettings.imageAltI18n),
    benefits: toBenefits(initialSettings.benefits),
    benefitsRu: toBenefits(initialSettings.benefitsI18n?.ru),
    benefitsEn: toBenefits(initialSettings.benefitsI18n?.en)
  });

  function updateLocaleField(field: keyof Pick<FormState, "badgeI18n" | "titleI18n" | "descriptionI18n" | "primaryTextI18n" | "secondaryTextI18n" | "imageAltI18n">, value: string) {
    setForm((current) => ({
      ...current,
      [field]: {
        ...current[field],
        [activeLocale]: value
      }
    }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося завантажити зображення.");
      setLoading(false);
      return;
    }

    setForm((current) => ({ ...current, imageSrc: data.url }));
    setLoading(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      badge: form.badge.trim(),
      badgeI18n: form.badgeI18n,
      title: form.title.trim(),
      titleI18n: form.titleI18n,
      description: form.description.trim(),
      descriptionI18n: form.descriptionI18n,
      primaryText: form.primaryText.trim(),
      primaryTextI18n: form.primaryTextI18n,
      primaryLink: form.primaryLink.trim(),
      secondaryText: form.secondaryText.trim(),
      secondaryTextI18n: form.secondaryTextI18n,
      secondaryLink: form.secondaryLink.trim(),
      imageSrc: form.imageSrc.trim(),
      imageAlt: form.imageAlt.trim(),
      imageAltI18n: form.imageAltI18n,
      benefits: form.benefits.split("\n").map((item) => item.trim()).filter(Boolean),
      benefitsI18n: {
        ru: form.benefitsRu.split("\n").map((item) => item.trim()).filter(Boolean),
        en: form.benefitsEn.split("\n").map((item) => item.trim()).filter(Boolean)
      }
    };

    const response = await fetch("/api/site-settings/hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося зберегти hero-секцію.");
      setLoading(false);
      return;
    }

    setMessage("Hero-секцію головної сторінки оновлено.");
    setLoading(false);
  }

  const tabs: Locale[] = ["uk", "ru", "en"];

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Головна</span>
          <h1>Hero-секція</h1>
          <p>Керуйте першим екраном головної сторінки окремо від товарів.</p>
        </div>
        <LogoutButton />
      </div>

      <form className="editorGrid compactAdminCard" onSubmit={handleSubmit}>
        <section className="panel formGrid">
          <div className="sectionHeading compact">
            <span className="eyebrow">Основне</span>
            <p>Головні тексти, кнопки та посилання hero-блоку.</p>
          </div>

          <input value={form.badge} onChange={(event) => setForm((current) => ({ ...current, badge: event.target.value }))} placeholder="Бейдж за замовчуванням" />
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Заголовок за замовчуванням" />
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Опис за замовчуванням" />
          <div className="splitGrid">
            <input value={form.primaryText} onChange={(event) => setForm((current) => ({ ...current, primaryText: event.target.value }))} placeholder="Текст основної кнопки" />
            <input value={form.primaryLink} onChange={(event) => setForm((current) => ({ ...current, primaryLink: event.target.value }))} placeholder="/catalog" />
          </div>
          <div className="splitGrid">
            <input value={form.secondaryText} onChange={(event) => setForm((current) => ({ ...current, secondaryText: event.target.value }))} placeholder="Текст другої кнопки" />
            <input value={form.secondaryLink} onChange={(event) => setForm((current) => ({ ...current, secondaryLink: event.target.value }))} placeholder="/admin/products" />
          </div>
          <textarea value={form.benefits} onChange={(event) => setForm((current) => ({ ...current, benefits: event.target.value }))} rows={4} placeholder="Переваги українською, кожна з нового рядка" />
        </section>

        <section className="panel formGrid">
          <div className="sectionHeading compact">
            <span className="eyebrow">Зображення</span>
            <p>Окреме зображення для hero та альтернативний текст.</p>
          </div>

          <input value={form.imageSrc} onChange={(event) => setForm((current) => ({ ...current, imageSrc: event.target.value }))} placeholder="URL або /uploads/..." />
          <input value={form.imageAlt} onChange={(event) => setForm((current) => ({ ...current, imageAlt: event.target.value }))} placeholder="Alt за замовчуванням" />
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageUpload} />
          {form.imageSrc ? <Image src={form.imageSrc} alt={form.imageAlt || "Hero"} width={900} height={900} className="cardImage" /> : null}
        </section>

        <section className="panel formGrid" style={{ gridColumn: "1 / -1" }}>
          <div className="sectionHeading compact">
            <span className="eyebrow">Переклади</span>
            <p>Окремі вкладки для RU та EN текстів hero-секції.</p>
          </div>
          <div className="chips adminMultiChips">
            {tabs.map((tab) => (
              <button key={tab} type="button" className={`chip ${activeLocale === tab ? "active" : ""}`} onClick={() => setActiveLocale(tab)}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <input value={form.badgeI18n[activeLocale]} onChange={(event) => updateLocaleField("badgeI18n", event.target.value)} placeholder={`Бейдж ${activeLocale.toUpperCase()}`} />
          <input value={form.titleI18n[activeLocale]} onChange={(event) => updateLocaleField("titleI18n", event.target.value)} placeholder={`Заголовок ${activeLocale.toUpperCase()}`} />
          <textarea value={form.descriptionI18n[activeLocale]} onChange={(event) => updateLocaleField("descriptionI18n", event.target.value)} rows={4} placeholder={`Опис ${activeLocale.toUpperCase()}`} />
          <input value={form.primaryTextI18n[activeLocale]} onChange={(event) => updateLocaleField("primaryTextI18n", event.target.value)} placeholder={`Основна кнопка ${activeLocale.toUpperCase()}`} />
          <input value={form.secondaryTextI18n[activeLocale]} onChange={(event) => updateLocaleField("secondaryTextI18n", event.target.value)} placeholder={`Друга кнопка ${activeLocale.toUpperCase()}`} />
          <input value={form.imageAltI18n[activeLocale]} onChange={(event) => updateLocaleField("imageAltI18n", event.target.value)} placeholder={`Alt ${activeLocale.toUpperCase()}`} />
          {activeLocale === "ru" ? (
            <textarea value={form.benefitsRu} onChange={(event) => setForm((current) => ({ ...current, benefitsRu: event.target.value }))} rows={4} placeholder="Переваги російською, кожна з нового рядка" />
          ) : null}
          {activeLocale === "en" ? (
            <textarea value={form.benefitsEn} onChange={(event) => setForm((current) => ({ ...current, benefitsEn: event.target.value }))} rows={4} placeholder="Benefits in English, one per line" />
          ) : null}
          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}
          <div className="actions">
            <button type="submit" className="button primary" disabled={loading}>{loading ? "Зберігаємо..." : "Зберегти hero-секцію"}</button>
          </div>
        </section>
      </form>
    </section>
  );
}
