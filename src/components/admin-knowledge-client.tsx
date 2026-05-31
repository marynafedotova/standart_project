"use client";

import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Node, mergeAttributes } from "@tiptap/core";
import { useRef, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import { EMPLOYEE_ROLE_OPTIONS, type EmployeeRole, type KnowledgeArticleRecord, type KnowledgeArticleStatus } from "@/lib/admin-workspace-shared";

type KnowledgeFormState = {
  id?: string;
  title: string;
  category: string;
  summary: string;
  status: KnowledgeArticleStatus;
  audience: EmployeeRole[];
};

const DEFAULT_AUDIENCE: EmployeeRole[] = ["owner", "admin", "manager", "editor", "support", "viewer"];

const EMPTY_FORM: KnowledgeFormState = {
  title: "",
  category: "",
  summary: "",
  status: "draft",
  audience: DEFAULT_AUDIENCE
};

const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: {
        default: null
      }
    };
  },
  parseHTML() {
    return [{ tag: "iframe[data-knowledge-video]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "iframe",
      mergeAttributes(HTMLAttributes, {
        "data-knowledge-video": "true",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowfullscreen: "true",
        loading: "lazy"
      })
    ];
  }
});

function normalizeCategory(value: string) {
  return value.trim() || "Без теми";
}

function textToHtml(value: string) {
  if (/<[a-z][\s\S]*>/i.test(value)) {
    return value;
  }

  return value
    .split(/\r?\n\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>`)
    .join("");
}

function toEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : value;
    }

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : value;
    }

    return value;
  } catch {
    return value;
  }
}

export function AdminKnowledgeClient({ initialArticles }: { initialArticles: KnowledgeArticleRecord[] }) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [articles, setArticles] = useState(initialArticles);
  const [form, setForm] = useState<KnowledgeFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https"
      }),
      ImageExtension,
      VideoEmbed,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      })
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptapEditor knowledgeRichEditor"
      }
    }
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const html = editor?.getHTML() ?? "";
    const text = editor?.getText().trim() ?? "";

    if (!text && !html.includes("<img")) {
      setError("Додайте текст або зображення до статті.");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        category: normalizeCategory(form.category),
        content: html
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося зберегти статтю.");
      setSaving(false);
      return;
    }

    setArticles(data.articles ?? []);
    setForm(EMPTY_FORM);
    editor?.commands.clearContent();
    setMessage("Статтю збережено.");
    setSaving(false);
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
      status: article.status,
      audience: article.audience
    });
    editor?.commands.setContent(textToHtml(article.content));
    setError("");
    setMessage("");
  }

  function toggleLink() {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Вставте посилання", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function insertVideo() {
    if (!editor) {
      return;
    }

    const url = window.prompt("Вставте посилання на відео", "https://");
    if (!url?.trim()) {
      return;
    }

    editor.chain().focus().insertContent({ type: "videoEmbed", attrs: { src: toEmbedUrl(url.trim()) } }).run();
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setUploadingImage(true);
    setError("");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося завантажити зображення.");
      setUploadingImage(false);
      return;
    }

    editor?.chain().focus().setImage({ src: data.url }).run();
    setUploadingImage(false);
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">База знань</span>
          <h1>Керування статтями</h1>
          <p>Створюйте інструкції з форматованим текстом, зображеннями, посиланнями, списками та відеоматеріалами.</p>
        </div>
        <div className="actions">
          <Link href="/admin/knowledge/articles" className="button secondary">
            Перегляд статей
          </Link>
          <LogoutButton />
        </div>
      </div>

      <form className="editorGrid singleColumn" onSubmit={handleSubmit}>
        <div className="panel formGrid">
          <div>
            <span className="eyebrow">Матеріал</span>
            <h2>{form.id ? "Редагування статті" : "Нова стаття"}</h2>
          </div>

          <label className="formField">
            <span>Заголовок</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
          </label>

          <div className="splitGrid">
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
              <span>Статус</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as KnowledgeArticleStatus }))}>
                <option value="draft">Чернетка</option>
                <option value="published">Опубліковано</option>
              </select>
            </label>
          </div>

          <label className="formField">
            <span>Короткий опис</span>
            <textarea rows={3} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
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
        </div>

        <div className="panel formGrid">
          <div className="metaLine">
            <h2>Контент статті</h2>
            <div className="toolbarButtons tiptapToolbar knowledgeToolbar">
              <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
              <button type="button" onClick={() => editor?.chain().focus().setFontFamily("Inter, sans-serif").run()}>Sans</button>
              <button type="button" onClick={() => editor?.chain().focus().setFontFamily("Georgia, serif").run()}>Serif</button>
              <button type="button" onClick={() => editor?.chain().focus().setFontFamily('"Courier New", monospace').run()}>Mono</button>
              <button type="button" onClick={() => editor?.chain().focus().unsetFontFamily().run()}>Reset</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>Список</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Список</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Цитата</button>
              <button type="button" onClick={toggleLink}>Посилання</button>
              <button type="button" onClick={() => imageInputRef.current?.click()}>Зображення</button>
              <button type="button" onClick={insertVideo}>Відео</button>
              <button type="button" onClick={() => editor?.chain().focus().setTextAlign("left").run()}>Ліворуч</button>
              <button type="button" onClick={() => editor?.chain().focus().setTextAlign("center").run()}>Центр</button>
              <button type="button" onClick={() => editor?.chain().focus().undo().run()}>Undo</button>
              <button type="button" onClick={() => editor?.chain().focus().redo().run()}>Redo</button>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="visuallyHidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadImage(file);
              }
              event.target.value = "";
            }}
          />

          {uploadingImage ? <p>Завантажуємо зображення...</p> : null}
          <EditorContent editor={editor} />
        </div>

        <div className="panel formGrid">
          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}

          <div className="actions">
            <button type="submit" className="button primary" disabled={saving || !editor}>
              {saving ? "Зберігаємо..." : form.id ? "Оновити статтю" : "Додати статтю"}
            </button>
            {form.id ? (
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  editor?.commands.clearContent();
                }}
              >
                Скасувати редагування
              </button>
            ) : null}
          </div>
        </div>

        <div className="panel">
          <div className="adminHeader">
            <div>
              <span className="eyebrow">Створені матеріали</span>
              <h2>Швидке редагування</h2>
            </div>
          </div>

          <div className="stackList">
            {articles.map((article) => (
              <article key={article.id} className="panel softPanel knowledgeArticleCard">
                <div className="adminHeader">
                  <div>
                    <h3>{article.title}</h3>
                    <p>{article.category}</p>
                  </div>
                  <span className={`statusBadge ${article.status === "published" ? "statusActive" : "statusMuted"}`}>
                    {article.status === "published" ? "Опубліковано" : "Чернетка"}
                  </span>
                </div>
                <div className="actions">
                  <Link href={`/admin/knowledge/${article.slug}`} className="button secondary">
                    Переглянути
                  </Link>
                  <button type="button" className="button secondary" onClick={() => handleEdit(article)}>
                    Редагувати
                  </button>
                </div>
              </article>
            ))}
            {articles.length === 0 ? <p>Поки що в базі знань немає статей.</p> : null}
          </div>
        </div>
      </form>
    </section>
  );
}
