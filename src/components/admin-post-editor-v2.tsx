"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { useMemo, useRef, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import type { AdminPost } from "@/components/admin-ui";
import type { DbPostBlock } from "@/lib/json-db";
import { slugify } from "@/lib/slug";

type PostFormState = {
  title: string;
  titleI18n: {
    ru: string;
    en: string;
  };
  slug: string;
  category: string;
  excerpt: string;
  excerptI18n: {
    ru: string;
    en: string;
  };
  cover: string;
  published: boolean;
};

export function AdminPostEditorV2({ post }: { post: AdminPost | null }) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [slugEdited, setSlugEdited] = useState(Boolean(post?.slug));
  const [form, setForm] = useState<PostFormState>({
    title: post?.title ?? "",
    titleI18n: {
      ru: post?.titleI18n?.ru ?? "",
      en: post?.titleI18n?.en ?? ""
    },
    slug: post?.slug ?? "",
    category: post?.category ?? "",
    excerpt: post?.excerpt ?? "",
    excerptI18n: {
      ru: post?.excerptI18n?.ru ?? "",
      en: post?.excerptI18n?.en ?? ""
    },
    cover: post?.cover ?? "",
    published: post?.published ?? true
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);

  const initialContent = useMemo(() => getInitialEditorContent(post), [post]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https"
      }),
      ImageExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      })
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "tiptapEditor"
      }
    }
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const html = editor?.getHTML() ?? "";
    const textContent = (editor?.getText() ?? "").trim();
    const contentLines = textContent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      title: form.title,
      titleI18n: {
        ru: form.titleI18n.ru.trim(),
        en: form.titleI18n.en.trim()
      },
      slug: form.slug,
      category: form.category,
      excerpt: form.excerpt,
      excerptI18n: {
        ru: form.excerptI18n.ru.trim(),
        en: form.excerptI18n.en.trim()
      },
      cover: form.cover,
      published: form.published,
      contentBlocks: [
        {
          id: post?.id ?? generateClientId(),
          type: "richText",
          html,
          align: "left"
        }
      ] satisfies DbPostBlock[],
      content: contentLines.length > 0 ? contentLines : [form.excerpt]
    };

    const method = post ? "PATCH" : "POST";
    const url = post ? `/api/posts/${post.id}` : "/api/posts";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const fieldErrors = data.details?.fieldErrors
        ? Object.entries(data.details.fieldErrors)
            .filter(([, value]) => Array.isArray(value) && value.length > 0)
            .map(([key, value]) => `${key}: ${(value as string[]).join(", ")}`)
        : [];

      setError(
        fieldErrors.length > 0
          ? fieldErrors.join(" | ")
          : data.error ?? "Не удалось сохранить пост."
      );
      setLoading(false);
      return;
    }

    setMessage(post ? "Пост обновлен." : "Пост создан.");
    if (!post) {
      router.push(`/admin/post/${data.id}`);
    }
    router.refresh();
    setLoading(false);
  }

  async function uploadImage(file: File, mode: "cover" | "editor") {
    const formData = new FormData();
    formData.append("file", file);

    if (mode === "cover") {
      setUploadingCover(true);
    } else {
      setUploadingEditorImage(true);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось загрузить изображение.");
      setUploadingCover(false);
      setUploadingEditorImage(false);
      return;
    }

    if (mode === "cover") {
      setForm((current) => ({ ...current, cover: data.url }));
      setUploadingCover(false);
      return;
    }

    editor?.chain().focus().setImage({ src: data.url }).run();
    setUploadingEditorImage(false);
  }

  function updateForm<K extends keyof PostFormState>(key: K, value: PostFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTitle(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugEdited ? current.slug : slugify(value)
    }));
  }

  function toggleLink() {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Вставьте ссылку", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Пост</span>
          <h1>Создание и редактирование поста</h1>
        </div>
        <LogoutButton />
      </div>

      <form className="editorGrid singleColumn" onSubmit={handleSubmit}>
        <div className="panel formGrid">
          <h2>Основное</h2>
          <input value={form.title} onChange={(event) => updateTitle(event.target.value)} type="text" placeholder="Заголовок поста" required />
          <div className="splitGrid">
            <input
              value={form.titleI18n.ru}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  titleI18n: { ...current.titleI18n, ru: event.target.value }
                }))
              }
              type="text"
              placeholder="Заголовок на русском"
            />
            <input
              value={form.titleI18n.en}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  titleI18n: { ...current.titleI18n, en: event.target.value }
                }))
              }
              type="text"
              placeholder="Post title in English"
            />
          </div>
          <input
            value={form.slug}
            onChange={(event) => {
              setSlugEdited(true);
              updateForm("slug", event.target.value);
            }}
            type="text"
            placeholder="URL поста"
            required
          />
          <input value={form.category} onChange={(event) => updateForm("category", event.target.value)} type="text" placeholder="Категория" required />
          <textarea value={form.excerpt} onChange={(event) => updateForm("excerpt", event.target.value)} rows={4} placeholder="Краткое описание для карточки поста" required />
          <div className="splitGrid">
            <textarea
              value={form.excerptI18n.ru}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  excerptI18n: { ...current.excerptI18n, ru: event.target.value }
                }))
              }
              rows={4}
              placeholder="Краткое описание на русском"
            />
            <textarea
              value={form.excerptI18n.en}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  excerptI18n: { ...current.excerptI18n, en: event.target.value }
                }))
              }
              rows={4}
              placeholder="Post excerpt in English"
            />
          </div>
        </div>

        <div className="panel formGrid">
          <h2>Обложка</h2>
          <input value={form.cover} onChange={(event) => updateForm("cover", event.target.value)} type="text" placeholder="URL или /uploads/..." required />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadImage(file, "cover");
              }
            }}
          />
          {uploadingCover ? <p>Загружаем обложку...</p> : null}
          {form.cover ? (
            <div className="postEditorPreviewImage">
              <Image src={form.cover} alt={form.title || "Обложка"} width={1200} height={700} className="cardImage" />
            </div>
          ) : null}
        </div>

        <div className="panel formGrid">
          <div className="metaLine">
            <h2>Контент</h2>
            <div className="toolbarButtons tiptapToolbar">
              <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>List</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
              <button type="button" onClick={toggleLink}>Link</button>
              <button type="button" onClick={() => imageInputRef.current?.click()}>Image</button>
              <button type="button" onClick={() => editor?.chain().focus().setTextAlign("left").run()}>Left</button>
              <button type="button" onClick={() => editor?.chain().focus().setTextAlign("center").run()}>Center</button>
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
                void uploadImage(file, "editor");
              }
              event.target.value = "";
            }}
          />

          {uploadingEditorImage ? <p>Загружаем изображение в статью...</p> : null}
          <EditorContent editor={editor} />
        </div>

        <div className="panel formGrid">
          <h2>Публикация</h2>
          <label className="checkbox">
            <input type="checkbox" checked={form.published} onChange={(event) => updateForm("published", event.target.checked)} />
            Опубликовать пост
          </label>
          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}
          <button type="submit" className="button primary" disabled={loading || !editor}>
            {loading ? "Сохраняем..." : post ? "Сохранить изменения" : "Создать пост"}
          </button>
        </div>
      </form>
    </section>
  );
}

function getInitialEditorContent(post: AdminPost | null) {
  const richBlock = post?.contentBlocks?.find((block) => block.type === "richText" && block.html);

  if (richBlock?.html) {
    return richBlock.html;
  }

  if (post?.contentBlocks && post.contentBlocks.length > 0) {
    return blocksToHtml(post.contentBlocks);
  }

  return (post?.content ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function blocksToHtml(blocks: DbPostBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "heading") {
        const tag = block.level === 3 ? "h3" : "h2";
        return `<${tag}>${escapeHtml(block.text ?? "")}</${tag}>`;
      }

      if (block.type === "quote") {
        return `<blockquote><p>${escapeHtml(block.text ?? "")}</p></blockquote>`;
      }

      if (block.type === "list") {
        return `<ul>${(block.items ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      }

      if (block.type === "image" && block.src) {
        return `<p><img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(block.alt ?? "")}" /></p>`;
      }

      return `<p>${escapeHtml(block.text ?? "")}</p>`;
    })
    .join("");
}

function generateClientId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

