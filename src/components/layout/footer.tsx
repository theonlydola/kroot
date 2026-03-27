import Link from "next/link";
import { Locale } from "@/lib/i18n";
import { getDictionary } from "@/app/[lang]/dictionaries";

export async function Footer({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-2">
          <Link href={`/${lang}`} className="font-bold text-foreground">
            {dict.meta.siteName}
          </Link>
          <span className="hidden sm:inline">—</span>
          <span>{dict.footer.tagline}</span>
        </div>
        <p>
          &copy; {new Date().getFullYear()} {dict.meta.siteName}.{" "}
          {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
