import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { Cairo } from "next/font/google";
import "../globals.css";
import { locales, type Locale, getDirection } from "@/lib/i18n";
import { hasLocale, getDictionary } from "./dictionaries";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  const otherLang = lang === "en" ? "ar" : "en";

  return {
    title: {
      default: dict.meta.homeTitle,
      template: `%s | ${dict.meta.siteName}`,
    },
    description: dict.meta.siteDescription,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://kroot.app"
    ),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        [lang]: `/${lang}`,
        [otherLang]: `/${otherLang}`,
      },
    },
    icons: {
      icon: "/kroot.svg",
    },
    openGraph: {
      title: dict.meta.homeTitle,
      description: dict.meta.siteDescription,
      siteName: dict.meta.siteName,
      locale: lang === "ar" ? "ar_EG" : "en_US",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const locale = lang as Locale;
  const dir = getDirection(locale);
  const isArabic = locale === "ar";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`min-h-full flex flex-col bg-background text-foreground ${isArabic ? "font-[family-name:var(--font-cairo)]" : "font-[family-name:var(--font-geist-sans)]"}`}
      >
        <ThemeProvider>
          <AnalyticsProvider lang={locale} />
          <Header lang={locale} />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer lang={locale} />
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
