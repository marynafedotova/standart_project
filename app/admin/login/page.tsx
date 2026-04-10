import { LoginForm } from "@/components/admin-forms";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next ?? "/admin/products";

  return (
    <main className="page loginPage">
      <LoginForm nextPath={nextPath} />
    </main>
  );
}
