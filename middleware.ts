import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/routing";

const SESSION_COOKIE = "admin_session";
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always"
});

function stripLocaleFromAdminPath(pathname: string) {
  for (const locale of locales) {
    const prefix = `/${locale}/admin`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(locale.length + 1);
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPathWithoutLocale = stripLocaleFromAdminPath(pathname);

  if (adminPathWithoutLocale) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = adminPathWithoutLocale;
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/login") {
      const token = request.cookies.get(SESSION_COOKIE)?.value;

      if (!token) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
