import { AdminNewsClient } from "@/components/admin-news-client";
import { requireAdmin } from "@/lib/auth";
import { getAdminPosts } from "@/lib/store";

export default async function AdminNewsPage() {
  await requireAdmin();
  const posts = await getAdminPosts();
  return <AdminNewsClient initialPosts={posts} />;
}
