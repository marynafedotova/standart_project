import { LoginForm } from "@/components/admin-forms";
import { locales } from "@/i18n/routing";

function normalizeAdminNextPath(nextPath?: string) {
  if (!nextPath) {
    return "/admin/products";
  }

  for (const locale of locales) {
    const prefix = `/${locale}/admin`;
    if (nextPath === prefix || nextPath.startsWith(`${prefix}/`)) {
      return nextPath.slice(locale.length + 1);
    }
  }

  return nextPath.startsWith("/admin") ? nextPath : "/admin/products";
}

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = normalizeAdminNextPath(params.next);

  return (
    <main className="page loginPage">
      <LoginForm nextPath={nextPath} />
    </main>
  );
}
