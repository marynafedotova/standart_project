"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import { EMPLOYEE_ROLE_OPTIONS, type EmployeeRole, type KnowledgeArticleRecord, type KnowledgeArticleStatus } from "@/lib/admin-workspace-shared";

type KnowledgeFormState = {
  id?: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  status: KnowledgeArticleStatus;
  audience: EmployeeRole[];
};

type KnowledgeGroup = {
  category: string;
  count: number;
  publishedCount: number;
  articles: KnowledgeArticleRecord[];
};

const DEFAULT_AUDIENCE: EmployeeRole[] = ["owner", "admin", "manager", "editor", "support", "viewer"];

const EMPTY_FORM: KnowledgeFormState = {
  title: "",
  category: "",
  summary: "",
  content: "",
  status: "draft",
  audience: DEFAULT_AUDIENCE
};

function normalizeCategory(value: string) {
  return value.trim() || "Без теми";
}

function formatAudience(audience: EmployeeRole[]) {
  return audience
    .map((role) => EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role)
    .join(", ");
}

function buildGroups(articles: KnowledgeArticleRecord[]): KnowledgeGroup[] {
  const map = new Map<string, KnowledgeArticleRecord[]>();

  for (const article of articles) {
    const key = normalizeCategory(article.category);
    const group = map.get(key) ?? [];
    group.push(article);
    map.set(key, group);
  }

  return [...map.entries()]
    .map(([category, categoryArticles]) => ({
      category,
      count: categoryArticles.length,
      publishedCount: categoryArticles.filter((article) => article.status === "published").length,
      articles: [...categoryArticles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }))
    .sort((a, b) => a.category.localeCompare(b.category, "uk"));
}

export function AdminKnowledgeClient({ initialArticles }: { initialArticles: KnowledgeArticleRecord[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [form, setForm] = useState<KnowledgeFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const groups = useMemo(() => buildGroups(articles), [articles]);

  const visibleGroups = useMemo(() => {
    if (selectedCategory === "all") {
      return groups;
    }

    return groups.filter((group) => group.category === selectedCategory);
  }, [groups, selectedCategory]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        category: normalizeCategory(form.category)
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося зберегти статтю.");
      setSaving(false);
      return;
    }

    setArticles(data.articles);
    setForm(EMPTY_FORM);
    setSelectedCategory("all");
    setMessage("Статтю збережено.");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setError("");
    setMessage("");

    const response = await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося видалити статтю.");
      return;
    }

    setArticles(data.articles);
    if (form.id === id) {
      setForm(EMPTY_FORM);
    }
    setMessage("Статтю видалено.");
  }

  function handleAudienceToggle(role: EmployeeRole) {
    setForm((current) => ({
      ...current,
      audience: current.audience.includes(role)
        ? current.audience.filter((item) => item !== role)
        : [...current.audience, role]
    }));
  }

  function handleEdit(article: KnowledgeArticleRecord) {
    setForm({
      id: article.id,
      title: article.title,
      category: article.category,
      summary: article.summary,
      content: article.content,
      status: article.status,
      audience: article.audience
    });
    setSelectedCategory(article.category);
    setError("");
    setMessage("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">База знань</span>
          <h1>Інструкції для співробітників</h1>
          <p>Зберігайте матеріали по тематиках, щоб співробітники швидко знаходили потрібні інструкції.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="splitAdminLayout knowledgeLayout">
        <form className="panel formGrid knowledgeEditorPanel" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Матеріал</span>
            <h2>{form.id ? "Редагування статті" : "Нова стаття"}</h2>
          </div>

          <label className="formField">
            <span>Заголовок</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="formField">
            <span>Тематика</span>
            <input
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Наприклад: Продажі, Склад, Робота з клієнтами"
              required
            />
          </label>

          <label className="formField">
            <span>Короткий опис</span>
            <textarea rows={3} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
          </label>

          <label className="formField">
            <span>Статус</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as KnowledgeArticleStatus }))}>
              <option value="draft">Чернетка</option>
              <option value="published">Опубліковано</option>
            </select>
          </label>

          <div className="formField">
            <span>Для кого доступно</span>
            <div className="chips adminMultiChips">
              {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  className={`chip ${form.audience.includes(role.value) ? "active" : ""}`}
                  onClick={() => handleAudienceToggle(role.value)}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <label className="formField">
            <span>Повний текст</span>
            <textarea
              rows={12}
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              placeholder="Додайте покрокову інструкцію, правила, приклади, чеклісти."
              required
            />
          </label>

          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}

          <div className="actions">
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? "Зберігаємо..." : form.id ? "Оновити статтю" : "Додати статтю"}
            </button>
            {form.id ? (
              <button type="button" className="button secondary" onClick={() => setForm(EMPTY_FORM)}>
                Скасувати редагування
              </button>
            ) : null}
          </div>
        </form>

        <div className="panel knowledgeLibraryPanel">
          <div className="adminHeader">
            <div>
              <span className="eyebrow">Бібліотека</span>
              <h2>Матеріали по тематиках</h2>
            </div>

            <label className="knowledgeFilter">
              <span className="visuallyHidden">Фільтр по тематиці</span>
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                <option value="all">Усі тематики</option>
                {groups.map((group) => (
                  <option key={group.category} value={group.category}>
                    {group.category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="knowledgeTopicGrid">
            {groups.map((group) => (
              <button
                key={group.category}
                type="button"
                className={`knowledgeTopicCard ${selectedCategory === group.category ? "active" : ""}`}
                onClick={() => setSelectedCategory((current) => (current === group.category ? "all" : group.category))}
              >
                <strong>{group.category}</strong>
                <span>{group.count} статей</span>
                <small>{group.publishedCount} опубліковано</small>
              </button>
            ))}
          </div>

          <div className="stackList">
            {visibleGroups.map((group) => (
              <section key={group.category} className="knowledgeTopicSection">
                <div className="knowledgeTopicHeader">
                  <div>
                    <h3>{group.category}</h3>
                    <p>{group.count} статей у темі</p>
                  </div>
                </div>

                <div className="stackList">
                  {group.articles.map((article) => (
                    <article key={article.id} className="panel softPanel knowledgeArticleCard">
                      <div className="adminHeader">
                        <div>
                          <h4>{article.title}</h4>
                          {article.summary ? <p>{article.summary}</p> : null}
                        </div>
                        <span className={`statusBadge ${article.status === "published" ? "statusActive" : "statusMuted"}`}>
                          {article.status === "published" ? "Опубліковано" : "Чернетка"}
                        </span>
                      </div>

                      <div className="knowledgeMeta">
                        <span>Доступ: {formatAudience(article.audience)}</span>
                        <span>Оновлено: {new Date(article.updatedAt).toLocaleString("uk-UA")}</span>
                      </div>

                      <div className="actions">
                        <Link href={`/admin/knowledge/${article.slug}`} className="button secondary">
                          Переглянути
                        </Link>
                        <button type="button" className="button secondary" onClick={() => handleEdit(article)}>
                          Редагувати
                        </button>
                        <button type="button" className="button ghostDanger" onClick={() => handleDelete(article.id)}>
                          Видалити
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {articles.length === 0 ? <p>Поки що в базі знань немає статей.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
