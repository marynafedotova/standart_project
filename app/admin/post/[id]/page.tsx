import { AdminPostEditorV2 } from "@/components/admin-post-editor-v2";
import { requireAdmin } from "@/lib/auth";
import { getPostById } from "@/lib/store";

export default async function AdminPostPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = id === "new" ? null : await getPostById(id);

  return <AdminPostEditorV2 post={post} />;
}
