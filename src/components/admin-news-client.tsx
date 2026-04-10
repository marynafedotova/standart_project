"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import type { AdminPost } from "@/components/admin-ui";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export function AdminNewsClient({ initialPosts }: { initialPosts: AdminPost[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleDelete(postId: string) {
    setLoadingId(postId);
    setError("");
    setMessage("");

    const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить пост.");
      setLoadingId("");
      return;
    }

    setPosts((current) => current.filter((post) => post.id !== postId));
    setMessage("Пост удалён.");
    setLoadingId("");
    router.refresh();
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Новости</span>
          <h1>Список постов</h1>
        </div>
        <div className="actions">
          <Link href="/admin/post/new" className="button primary">Создать пост</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="blogGrid">
        {posts.map((post) => {
          const isDeleting = loadingId === post.id;

          return (
            <article key={post.id} className="panel">
              <div className="metaLine">
                <span>{post.category}</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <div className="actions">
                <Link href={`/admin/post/${post.id}`} className="button secondary">
                  Редактировать
                </Link>
                <button
                  type="button"
                  className="button secondary"
                  disabled={isDeleting}
                  onClick={() => handleDelete(post.id)}
                >
                  {isDeleting ? "Удаляем..." : "Удалить"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {error ? <p className="errorText">{error}</p> : null}
      {message ? <p className="successText">{message}</p> : null}
    </section>
  );
}
