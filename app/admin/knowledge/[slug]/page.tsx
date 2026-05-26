import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoutButton } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth";
import { getKnowledgeArticleBySlug } from "@/lib/admin-workspace";
import { EMPLOYEE_ROLE_OPTIONS } from "@/lib/admin-workspace-shared";

function formatAudience(audience: string[]) {
  return audience.map((role) => EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role).join(", ");
}

export default async function AdminKnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const article = await getKnowledgeArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <section className="adminPage knowledgeArticlePage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">База знань</span>
          <h1>{article.title}</h1>
          <p>{article.summary || article.category}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="panel knowledgeArticleHero">
        <div className="knowledgeArticleHeroTop">
          <Link href="/admin/knowledge" className="button secondary">
            До бази знань
          </Link>
          <span className={`statusBadge ${article.status === "published" ? "statusActive" : "statusMuted"}`}>
            {article.status === "published" ? "Опубліковано" : "Чернетка"}
          </span>
        </div>

        <div className="knowledgeArticleFacts">
          <div>
            <strong>Тематика</strong>
            <span>{article.category}</span>
          </div>
          <div>
            <strong>Для ролей</strong>
            <span>{formatAudience(article.audience)}</span>
          </div>
          <div>
            <strong>Оновив</strong>
            <span>{article.updatedBy}</span>
          </div>
          <div>
            <strong>Дата</strong>
            <span>{new Date(article.updatedAt).toLocaleString("uk-UA")}</span>
          </div>
        </div>
      </div>

      <article className="panel knowledgeArticleBody">
        {article.content.split(/\r?\n\r?\n/).map((paragraph, index) => (
          <p key={`${article.id}-${index}`}>{paragraph}</p>
        ))}
      </article>
    </section>
  );
}
