import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdminApi } from "@/lib/auth";
import { readDb, stampNow, writeDb } from "@/lib/json-db";
import { ensureUniqueSlug } from "@/lib/slug";
import { postSchema } from "@/lib/validators";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.posts.filter((item) => item.published));
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const body = await request.json();
  const db = await readDb();
  const parsed = postSchema.safeParse({
    ...body,
    slug: ensureUniqueSlug(body.slug || body.title || "post", db.posts.map((item) => item.slug))
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

  const now = stampNow();
  const post = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now
  };

  db.posts.unshift(post);
  await writeDb(db);

  return NextResponse.json(post, { status: 201 });
}
