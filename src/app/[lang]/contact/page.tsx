import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { hasLocale, getDictionary } from "../dictionaries";
import { ContactForm } from "./contact-form";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kroot.online";

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
    title: dict.contact.metaTitle,
    description: dict.contact.metaDescription,
    alternates: {
      canonical: `/${lang}/contact`,
      languages: {
        [lang]: `/${lang}/contact`,
        [otherLang]: `/${otherLang}/contact`,
        "x-default": "/en/contact",
      },
    },
    openGraph: {
      title: dict.contact.metaTitle,
      description: dict.contact.metaDescription,
      url: `${BASE_URL}/${lang}/contact`,
      locale: lang === "ar" ? "ar_EG" : "en_US",
      alternateLocale: lang === "ar" ? "en_US" : "ar_EG",
      type: "website",
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {dict.contact.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{dict.contact.description}</p>
      </div>

      <ContactForm dict={dict.contact} />
    </section>
  );
}
