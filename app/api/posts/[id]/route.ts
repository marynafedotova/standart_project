import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { readDb, stampNow, writeDb } from "@/lib/json-db";
import { ensureUniqueSlug } from "@/lib/slug";
import { postSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await readDb();
  const post = db.posts.find((item) => item.id === id);

  if (!post) {
    return NextResponse.json({ error: "Пост не найден." }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = await readDb();
  const currentPost = db.posts.find((item) => item.id === id);
  const parsed = postSchema.safeParse({
    ...body,
    slug: ensureUniqueSlug(
      body.slug || body.title || currentPost?.title || "post",
      db.posts.map((item) => item.slug),
      currentPost?.slug
    )
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Некорректные данные поста.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const index = db.posts.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Пост не найден." }, { status: 404 });
  }

  const post = {
    ...db.posts[index],
    ...parsed.data,
    updatedAt: stampNow()
  };

  db.posts[index] = post;
  await writeDb(db);

  return NextResponse.json(post);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const { id } = await params;
  const db = await readDb();
  db.posts = db.posts.filter((item) => item.id !== id);
  await writeDb(db);

  return NextResponse.json({ ok: true });
}
