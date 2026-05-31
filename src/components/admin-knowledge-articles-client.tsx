"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import { EMPLOYEE_ROLE_OPTIONS, type KnowledgeArticleRecord } from "@/lib/admin-workspace-shared";

type KnowledgeTopic = {
  name: string;
  count: number;
  publishedCount: number;
  articles: KnowledgeArticleRecord[];
};

function formatAudience(article: KnowledgeArticleRecord) {
  return article.audience.map((role) => EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role).join(", ");
}

function groupByTopic(articles: KnowledgeArticleRecord[]): KnowledgeTopic[] {
  const topics = new Map<string, KnowledgeArticleRecord[]>();

  for (const article of articles) {
    const topic = article.category.trim() || "Без теми";
    const current = topics.get(topic) ?? [];
    current.push(article);
    topics.set(topic, current);
  }

  return [...topics.entries()]
    .map(([name, topicArticles]) => ({
      name,
      count: topicArticles.length,
      publishedCount: topicArticles.filter((article) => article.status === "published").length,
      articles: [...topicArticles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export function AdminKnowledgeArticlesClient({ articles }: { articles: KnowledgeArticleRecord[] }) {
  const [selectedTopic, setSelectedTopic] = useState("all");
  const topics = useMemo(() => groupByTopic(articles), [articles]);
  const visibleTopics = selectedTopic === "all" ? topics : topics.filter((topic) => topic.name === selectedTopic);

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">База знань</span>
          <h1>Перегляд статей</h1>
          <p>Матеріали згруповані по тематиках, щоб співробітники швидко відкривали потрібну інструкцію.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="panel knowledgeLibraryPanel">
        <div className="adminHeader">
          <div>
            <span className="eyebrow">Бібліотека</span>
            <h2>Матеріали по тематиках</h2>
          </div>

          <label className="knowledgeFilter">
            <span>Фільтр по тематиці</span>
            <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
              <option value="all">Усі тематики</option>
              {topics.map((topic) => (
                <option key={topic.name} value={topic.name}>
                  {topic.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="knowledgeTopicGrid">
          {topics.map((topic) => (
            <button
              key={topic.name}
              type="button"
              className={`knowledgeTopicCard ${selectedTopic === topic.name ? "active" : ""}`}
              onClick={() => setSelectedTopic((current) => (current === topic.name ? "all" : topic.name))}
            >
              <strong>{topic.name}</strong>
              <span>{topic.count} статей</span>
              <small>{topic.publishedCount} опубліковано</small>
            </button>
          ))}
        </div>

        <div className="actions">
          <Link href="/admin/knowledge" className="button secondary">
            Керування статтями
          </Link>
        </div>
      </div>

      <div className="stackList">
        {visibleTopics.map((topic) => (
          <section key={topic.name} className="panel knowledgeTopicSection">
            <div className="knowledgeTopicHeader">
              <div>
                <span className="eyebrow">Тематика</span>
                <h2>{topic.name}</h2>
              </div>
              <span className="statusBadge statusMuted">{topic.articles.length} статей</span>
            </div>

            <div className="stackList">
              {topic.articles.map((article) => (
                <article key={article.id} className="panel softPanel knowledgeArticleCard">
                  <div className="adminHeader">
                    <div>
                      <h3>{article.title}</h3>
                      {article.summary ? <p>{article.summary}</p> : null}
                    </div>
                    <span className={`statusBadge ${article.status === "published" ? "statusActive" : "statusMuted"}`}>
                      {article.status === "published" ? "Опубліковано" : "Чернетка"}
                    </span>
                  </div>

                  <div className="knowledgeMeta">
                    <span>Доступ: {formatAudience(article)}</span>
                    <span>Оновлено: {new Date(article.updatedAt).toLocaleString("uk-UA")}</span>
                  </div>

                  <div className="actions">
                    <Link href={`/admin/knowledge/${article.slug}`} className="button secondary">
                      Відкрити статтю
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {articles.length === 0 ? <p>Поки що в базі знань немає статей.</p> : null}
      </div>
    </section>
  );
}
