import { notFound } from "next/navigation";
import { BlogPostDetails, StoreShell } from "@/components/storefront-db";
import { getPostBySlug } from "@/lib/store";

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <StoreShell>
      <BlogPostDetails post={post} />
    </StoreShell>
  );
}
