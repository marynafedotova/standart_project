import Link from "next/link";
import { LogoutButton } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth";
import { getKnowledgeArticles } from "@/lib/admin-workspace";
import { EMPLOYEE_ROLE_OPTIONS, type KnowledgeArticleRecord } from "@/lib/admin-workspace-shared";

type KnowledgeTopic = {
  name: string;
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
      articles: [...topicArticles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export default async function AdminKnowledgeArticlesPage() {
  await requireAdmin();
  const articles = await getKnowledgeArticles();
  const topics = groupByTopic(articles);

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">База знань</span>
          <h1>Перегляд статей</h1>
          <p>Окрема сторінка для читання створених інструкцій по тематиках.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="adminHeader">
        <Link href="/admin/knowledge" className="button secondary">
          Керування статтями
        </Link>
      </div>

      <div className="stackList">
        {topics.map((topic) => (
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

        {topics.length === 0 ? <p>Поки що в базі знань немає статей.</p> : null}
      </div>
    </section>
  );
}
