import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { deleteKnowledgeArticle, getKnowledgeArticles, saveKnowledgeArticle } from "@/lib/admin-workspace";
import type { EmployeeRole, KnowledgeArticleStatus } from "@/lib/admin-workspace-shared";

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    title?: string;
    category?: string;
    summary?: string;
    content?: string;
    status?: KnowledgeArticleStatus;
    audience?: EmployeeRole[];
  };

  if (!body.title?.trim() || !body.category?.trim() || !body.content?.trim() || !body.status) {
    return NextResponse.json({ error: "Заповніть заголовок, категорію, статус та текст статті." }, { status: 400 });
  }

  await saveKnowledgeArticle({
    id: body.id,
    title: body.title,
    category: body.category,
    summary: body.summary ?? "",
    content: body.content,
    status: body.status,
    audience: body.audience ?? [],
    updatedBy: admin.email
  });

  return NextResponse.json({ articles: await getKnowledgeArticles() });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing article id." }, { status: 400 });
  }

  await deleteKnowledgeArticle(id);
  return NextResponse.json({ articles: await getKnowledgeArticles() });
}
