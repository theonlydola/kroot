import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { Cairo } from "next/font/google";
import "../globals.css";
import { locales, type Locale, getDirection } from "@/lib/i18n";
import { hasLocale, getDictionary } from "./dictionaries";
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

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kroot.online";

  return {
    title: {
      default: dict.meta.homeTitle,
      template: `%s | ${dict.meta.siteName}`,
    },
    description: dict.meta.siteDescription,
    keywords: [
      "ألعاب ورق",
      "ألعاب جماعية",
      "ألعاب حفلات",
      "كروت",
      "ألعاب مجانية",
      "المندس",
      "قصص مظلمة",
      "صراحة ولا جرأة",
      "النهاية السوداء",
      "قول اميم",
      "card games",
      "party games",
      "group games",
      "kroot",
      "free games",
      "imposter",
      "dark stories",
      "truth or dare",
      "would you rather",
      "2ool ameme",
      "arcade store",
    ],
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        [lang]: `/${lang}`,
        [otherLang]: `/${otherLang}`,
        "x-default": "/en",
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
      alternateLocale: lang === "ar" ? "en_US" : "ar_EG",
      type: "website",
      url: `${BASE_URL}/${lang}`,
    },
    twitter: {
      card: "summary",
      title: dict.meta.homeTitle,
      description: dict.meta.siteDescription,
    },
    applicationName: dict.meta.siteName,
    category: "games",
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
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kroot.online";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kroot",
    url: BASE_URL,
    logo: `${BASE_URL}/kroot.svg`,
  };

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className={`min-h-full flex flex-col bg-background text-foreground ${isArabic ? "font-[family-name:var(--font-cairo)]" : "font-[family-name:var(--font-geist-sans)]"}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <ThemeProvider>
          <AnalyticsProvider lang={locale} />
          <Header lang={locale} />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer lang={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
