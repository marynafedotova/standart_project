"use client";

import { useState } from "react";
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

const EMPTY_FORM: KnowledgeFormState = {
  title: "",
  category: "",
  summary: "",
  content: "",
  status: "draft",
  audience: ["owner", "admin", "manager", "editor", "support", "viewer"]
};

export function AdminKnowledgeClient({ initialArticles }: { initialArticles: KnowledgeArticleRecord[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [form, setForm] = useState<KnowledgeFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося зберегти статтю.");
      setSaving(false);
      return;
    }

    setArticles(data.articles);
    setForm(EMPTY_FORM);
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
    setError("");
    setMessage("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">База знань</span>
          <h1>Інструкції для співробітників</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="splitAdminLayout">
        <form className="panel formGrid" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Матеріал</span>
            <h2>{form.id ? "Редагування статті" : "Нова стаття"}</h2>
          </div>

          <label className="formField">
            <span>Заголовок</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
          </label>

          <label className="formField">
            <span>Категорія</span>
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
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
            <textarea rows={10} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} required />
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

        <div className="panel">
          <div className="adminHeader">
            <div>
              <span className="eyebrow">Бібліотека</span>
              <h2>Матеріали</h2>
            </div>
          </div>

          <div className="stackList">
            {articles.map((article) => (
              <article key={article.id} className="panel softPanel">
                <div className="adminHeader">
                  <div>
                    <h3>{article.title}</h3>
                    <p>{article.category}</p>
                  </div>
                  <span className={`statusBadge ${article.status === "published" ? "statusActive" : "statusMuted"}`}>
                    {article.status === "published" ? "Опубліковано" : "Чернетка"}
                  </span>
                </div>

                {article.summary ? <p>{article.summary}</p> : null}
                <p>Доступ: {article.audience.map((role) => EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role).join(", ")}</p>
                <p>Оновлено: {new Date(article.updatedAt).toLocaleString("uk-UA")}</p>

                <div className="actions">
                  <button type="button" className="button secondary" onClick={() => handleEdit(article)}>
                    Редагувати
                  </button>
                  <button type="button" className="button ghostDanger" onClick={() => handleDelete(article.id)}>
                    Видалити
                  </button>
                </div>
              </article>
            ))}

            {articles.length === 0 ? <p>Поки що в базі знань немає статей.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
