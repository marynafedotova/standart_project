import { AdminKnowledgeArticlesClient } from "@/components/admin-knowledge-articles-client";
import { requireAdmin } from "@/lib/auth";
import { getKnowledgeArticles } from "@/lib/admin-workspace";

export default async function AdminKnowledgeArticlesPage() {
  await requireAdmin();
  const articles = await getKnowledgeArticles();

  return <AdminKnowledgeArticlesClient articles={articles} />;
}
