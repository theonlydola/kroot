import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { locales, defaultLocale } from "@/lib/i18n";

function getLocale(request: NextRequest): string {
  try {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const languages = new Negotiator({ headers }).languages().filter((l) => l !== "*");
    if (languages.length === 0) return defaultLocale;
    return match(languages, [...locales], defaultLocale);
  } catch {
    return defaultLocale;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  // Rewrite root path so crawlers (e.g. AdSense) see content at /
  if (pathname === "/") {
    return NextResponse.rewrite(request.nextUrl);
  }

  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|sitemap.xml|robots.txt|ads.txt|.*\\..*).*)",
  ],
};
