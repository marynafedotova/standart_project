import { BlogSections, StoreShell } from "@/components/storefront-db";
import { getPosts } from "@/lib/store";

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <StoreShell>
      <BlogSections posts={posts} />
    </StoreShell>
  );
}
