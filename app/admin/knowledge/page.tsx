import { AdminKnowledgeClient } from "@/components/admin-knowledge-client";
import { requireAdmin } from "@/lib/auth";
import { getKnowledgeArticles } from "@/lib/admin-workspace";

export default async function AdminKnowledgePage() {
  await requireAdmin();
  const articles = await getKnowledgeArticles();

  return <AdminKnowledgeClient initialArticles={articles} />;
}
